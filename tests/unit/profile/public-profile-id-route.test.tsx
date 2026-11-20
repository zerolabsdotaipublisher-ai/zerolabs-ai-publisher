import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "@/config/routes";
import { getPublicProfileHref } from "@/lib/profile-public";

const mocks = vi.hoisted(() => ({
  getPublicProfileByProfileUserId: vi.fn(),
  getPublicProfileByUsername: vi.fn(),
  getPublicCommunityPostsForAuthor: vi.fn(),
  getPublicWebsitesForOwner: vi.fn(),
  getServerUser: vi.fn(),
  getProfileRelationship: vi.fn(),
  getProfileSocialStats: vi.fn(),
  resolveProfileMediaDisplayUrls: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));
vi.mock("@/lib/supabase/profile", () => ({
  getPublicProfileByProfileUserId: mocks.getPublicProfileByProfileUserId,
  getPublicProfileByUsername: mocks.getPublicProfileByUsername,
}));
vi.mock("@/lib/supabase/server", () => ({
  getServerUser: mocks.getServerUser,
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
vi.mock("@/components/profile/profile-follow-button", () => ({
  ProfileFollowButton: ({ profileUserId, isFollowing }: { profileUserId: string; isFollowing: boolean }) => (
    <button type="button" data-follow-target={profileUserId}>{isFollowing ? "Following" : "Follow"}</button>
  ),
}));

import IdPublicProfilePage from "@/app/(app)/profile/u/id/[id]/page";
import UsernamePublicProfilePage from "@/app/(app)/profile/u/[username]/page";

const viewerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const profileUserId = "33333333-3333-4333-8333-333333333333";
const viewedProfile = {
  id: profileUserId,
  full_name: "Legacy Author",
  avatar_url: null,
  first_name: "Legacy",
  last_name: "Author",
  username: null,
  country: "Philippines",
  date_of_birth: "1990-05-11",
  preferences: {
    profileVisibility: { showAge: false, showLocation: true },
    profileAppearance: {
      coverUrl: "https://stored.example/legacy-cover.png",
      coverFocalPoint: "center",
      background: { type: "image", preset: "image", color: null, imageUrl: "https://stored.example/legacy-background.png" },
      visualStyle: "soft",
      cardShape: "rounded",
      accent: "mint",
      textAlignment: "left",
      contentWidth: "standard",
    },
  },
  // These values model fields that must never reach the visitor presentation.
  email: "private-author@example.com",
  metadata: { privateNote: "do not render" },
};

function notFoundSignal(): never {
  throw new Error("NEXT_NOT_FOUND");
}

function redirectSignal(path: string): never {
  throw new Error(`NEXT_REDIRECT:${path}`);
}

/** Executes the async public-profile component returned by an App Router page before static rendering it. */
async function renderPublicProfilePage(element: ReactElement): Promise<string> {
  if (typeof element.type !== "function") throw new Error("Expected a public-profile page component.");

  const page = await (element.type as (props: typeof element.props) => Promise<ReactElement>)(element.props);
  return renderToStaticMarkup(page);
}

describe("Feed public-profile ID route contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notFound.mockImplementation(notFoundSignal);
    mocks.redirect.mockImplementation(redirectSignal);
    mocks.getServerUser.mockResolvedValue({ id: viewerId });
    mocks.getPublicProfileByProfileUserId.mockImplementation(async (id: string) => id === profileUserId ? viewedProfile : null);
    mocks.getPublicProfileByUsername.mockResolvedValue({ ...viewedProfile, username: "legacy.author" });
    mocks.getPublicWebsitesForOwner.mockResolvedValue([]);
    mocks.getPublicCommunityPostsForAuthor.mockResolvedValue([
      { id: "viewed_public_post", title: "Viewed public update", body: "Only the viewed profile's public post.", created_at: "2026-01-01T00:00:00.000Z" },
    ]);
    mocks.getProfileSocialStats.mockResolvedValue({ followersCount: 4, followingCount: 2 });
    mocks.getProfileRelationship.mockResolvedValue({ isSelf: false, isFollowing: true });
    mocks.resolveProfileMediaDisplayUrls.mockResolvedValue({
      avatarUrl: "https://signed.example/legacy-avatar.png",
      coverUrl: "https://signed.example/legacy-cover.png",
      backgroundUrl: "https://signed.example/legacy-background.png",
    });
  });

  it("resolves a legacy Feed author through its canonical ID route and renders the viewed public profile", async () => {
    const href = getPublicProfileHref({ profileUserId, username: null });

    expect(href).toBe(`/profile/u/id/${profileUserId}`);

    const markup = await renderPublicProfilePage(await IdPublicProfilePage({
      params: Promise.resolve({ id: profileUserId }),
    }));

    expect(mocks.getPublicProfileByProfileUserId).toHaveBeenCalledWith(profileUserId);
    expect(mocks.getPublicWebsitesForOwner).toHaveBeenCalledWith(profileUserId);
    expect(mocks.getPublicCommunityPostsForAuthor).toHaveBeenCalledWith(profileUserId);
    expect(mocks.getPublicCommunityPostsForAuthor).not.toHaveBeenCalledWith(viewerId);
    expect(mocks.getProfileRelationship).toHaveBeenCalledWith(viewerId, profileUserId);
    expect(mocks.resolveProfileMediaDisplayUrls).toHaveBeenCalledWith({
      userId: profileUserId,
      avatarReference: null,
      coverReference: "https://stored.example/legacy-cover.png",
      backgroundReference: "https://stored.example/legacy-background.png",
    });
    expect(markup).toContain("Legacy Author");
    expect(markup).toContain("Philippines");
    expect(markup).toContain("4</strong> Followers");
    expect(markup).toContain("2</strong> Following");
    expect(markup).toContain('src="https://signed.example/legacy-avatar.png"');
    expect(markup).toContain('src="https://signed.example/legacy-cover.png"');
    expect(markup).toContain('src="https://signed.example/legacy-background.png"');
    expect(markup).toContain("Viewed public update");
    expect(markup).toContain("Following");
    expect(markup).toContain(`data-follow-target="${profileUserId}"`);
    expect(markup).not.toContain("private-author@example.com");
    expect(markup).not.toContain("do not render");
    expect(markup).not.toContain("1990-05-11");
    expect(markup).not.toContain("Edit profile");
    expect(markup).not.toContain("Account settings");
    expect(markup).not.toContain("Security");
    expect(markup).not.toContain("Password");
  });

  it("returns 404 for a malformed or nonexistent ID", async () => {
    await expect(IdPublicProfilePage({ params: Promise.resolve({ id: "not-a-profile-user-id" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(IdPublicProfilePage({ params: Promise.resolve({ id: "44444444-4444-4444-8444-444444444444" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(2);
    expect(mocks.getPublicProfileByProfileUserId).toHaveBeenCalledTimes(1);
  });

  it("keeps the username route working for profiles that have one", async () => {
    const markup = await renderPublicProfilePage(await UsernamePublicProfilePage({
      params: Promise.resolve({ username: "legacy.author" }),
    }));

    expect(mocks.getPublicProfileByUsername).toHaveBeenCalledWith("legacy.author");
    expect(mocks.getPublicCommunityPostsForAuthor).toHaveBeenCalledWith(profileUserId);
    expect(markup).toContain("Legacy Author");
    expect(markup).toContain("@legacy.author");
  });

  it("keeps the owner route canonical instead of rendering a visitor profile", async () => {
    mocks.getServerUser.mockResolvedValue({ id: profileUserId });

    const page = await IdPublicProfilePage({ params: Promise.resolve({ id: profileUserId }) });
    await expect(renderPublicProfilePage(page)).rejects.toThrow(`NEXT_REDIRECT:${routes.profile}`);

    expect(mocks.redirect).toHaveBeenCalledWith(routes.profile);
    expect(mocks.getPublicCommunityPostsForAuthor).not.toHaveBeenCalled();
  });
});
