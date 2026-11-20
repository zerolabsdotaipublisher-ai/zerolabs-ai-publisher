import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getServerUser: vi.fn(),
  getPublicCommunityPostsForAuthor: vi.fn(),
  getPublicWebsitesForOwner: vi.fn(),
  getProfileRelationship: vi.fn(),
  getProfileSocialStats: vi.fn(),
  resolveProfileMediaDisplayUrls: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: () => ({ from: mocks.from }),
  getServerUser: mocks.getServerUser,
}));
vi.mock("@/lib/admin/access", () => ({
  isAdminEmail: () => false,
  resolveAdminRole: (_email: string, role?: string) => role === "admin" ? "admin" : "user",
}));
vi.mock("@/lib/observability", () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError },
}));
vi.mock("@/app/(app)/feed/queries", () => ({
  getPublicCommunityPostsForAuthor: mocks.getPublicCommunityPostsForAuthor,
  getPublicWebsitesForOwner: mocks.getPublicWebsitesForOwner,
}));
vi.mock("@/lib/profile-social", () => ({
  getProfileRelationship: mocks.getProfileRelationship,
  getProfileSocialStats: mocks.getProfileSocialStats,
}));
vi.mock("@/lib/profile-media-server", () => ({
  resolveProfileMediaDisplayUrls: mocks.resolveProfileMediaDisplayUrls,
}));

import IdPublicProfilePage from "@/app/(app)/profile/u/id/[id]/page";

const viewedUserId = "55555555-5555-4555-8555-555555555555";
const viewerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const profileWithoutPreferences = {
  id: viewedUserId,
  full_name: "Legacy Author",
  avatar_url: null,
  first_name: "Legacy",
  last_name: "Author",
  username: null,
  country: "Philippines",
  date_of_birth: "1990-05-11",
};

function notFoundSignal(): never {
  throw new Error("NEXT_NOT_FOUND");
}

function configureProfileQuery(results: Array<{ data: typeof profileWithoutPreferences | null; error: { code: string; message: string } | null }>) {
  const selects: string[] = [];
  const comparisons: Array<[string, string]> = [];

  mocks.from.mockReturnValue({
    select: vi.fn((fields: string) => {
      selects.push(fields);
      const result = results[selects.length - 1];
      return {
        eq: vi.fn((field: string, value: string) => {
          comparisons.push([field, value]);
          return { maybeSingle: vi.fn().mockResolvedValue(result) };
        }),
      };
    }),
  });

  return { selects, comparisons };
}

async function renderResolvedProfile(): Promise<string> {
  const routeElement = await IdPublicProfilePage({ params: Promise.resolve({ id: viewedUserId }) });
  if (typeof routeElement.type !== "function") throw new Error("Expected the public-profile page component.");

  const profileElement = await (routeElement.type as (props: typeof routeElement.props) => Promise<ReactElement>)(routeElement.props);
  return renderToStaticMarkup(profileElement);
}

describe("ID public-profile route schema fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notFound.mockImplementation(notFoundSignal);
    mocks.getServerUser.mockResolvedValue({ id: viewerId });
    mocks.getPublicWebsitesForOwner.mockResolvedValue([]);
    mocks.getPublicCommunityPostsForAuthor.mockResolvedValue([
      { id: "viewed_public_post", title: "Viewed update", body: "Public post", created_at: "2026-01-01T00:00:00.000Z" },
    ]);
    mocks.getProfileSocialStats.mockResolvedValue({ followersCount: 0, followingCount: 0 });
    mocks.getProfileRelationship.mockResolvedValue({ isSelf: false, isFollowing: false });
    mocks.resolveProfileMediaDisplayUrls.mockResolvedValue({ avatarUrl: null, coverUrl: null, backgroundUrl: null });
  });

  it("renders the viewed legacy profile when the initial ID lookup encounters a missing optional preferences column", async () => {
    const query = configureProfileQuery([
      { data: null, error: { code: "42703", message: "column profiles.preferences does not exist" } },
      { data: profileWithoutPreferences, error: null },
    ]);

    const markup = await renderResolvedProfile();

    expect(query.selects).toEqual([
      "id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth, preferences",
      "id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth",
    ]);
    expect(query.comparisons).toEqual([["id", viewedUserId], ["id", viewedUserId]]);
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.getPublicCommunityPostsForAuthor).toHaveBeenCalledWith(viewedUserId);
    expect(mocks.getPublicCommunityPostsForAuthor).not.toHaveBeenCalledWith(viewerId);
    expect(markup).toContain("Legacy Author");
    expect(markup).toContain("Viewed update");
  });

  it("propagates an unexpected lookup failure instead of converting it into a 404", async () => {
    configureProfileQuery([
      { data: null, error: { code: "XX000", message: "database lookup failed" } },
    ]);

    await expect(IdPublicProfilePage({ params: Promise.resolve({ id: viewedUserId }) })).rejects.toThrow(
      "Unable to load the public profile.",
    );

    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.loggerError).toHaveBeenCalledOnce();
  });
});
