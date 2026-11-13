import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
  resolveProfileMediaDisplayUrl: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient: mocks.getSupabaseServerClient }));
vi.mock("@/lib/profile-media-server", () => ({ resolveProfileMediaDisplayUrl: mocks.resolveProfileMediaDisplayUrl }));

import { getCommunityFeed } from "@/app/(app)/feed/queries";

const originalAvatarReference = "supabase:profile-media:author_fixture/avatar/profile-avatar-11111111-1111-4111-8111-111111111111.png";
const replacementAvatarReference = "supabase:profile-media:author_fixture/avatar/profile-avatar-22222222-2222-4222-8222-222222222222.png";

let avatarReference: string | null;
let profileRecords: Array<Record<string, unknown>>;

function queryWithIn(getResult: () => unknown) {
  return {
    select: vi.fn().mockReturnValue({ in: vi.fn().mockImplementation(async () => getResult()) }),
  };
}

function createFeedSupabase() {
  const posts = [
    { id: "post_one", user_id: "author_fixture", title: null, body: "First update", visibility: "public", created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" },
    { id: "post_two", user_id: "author_fixture", title: null, body: "Second update", visibility: "public", created_at: "2026-01-02T00:00:00.000Z", updated_at: "2026-01-02T00:00:00.000Z" },
  ];
  const emptyResult = { data: [], error: null };

  return {
    from: vi.fn((table: string) => {
      if (table === "community_posts") {
        return { select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: posts, error: null }) }) };
      }
      if (table === "profiles") {
        return queryWithIn(() => ({ data: profileRecords, error: null }));
      }
      if (table === "community_post_comments") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue(emptyResult) }),
            }),
          }),
        };
      }
      return queryWithIn(() => emptyResult);
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "viewer_fixture", email: "viewer@example.com" } } }) },
    storage: { from: vi.fn() },
  };
}

describe("community feed avatar resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    avatarReference = originalAvatarReference;
    profileRecords = [{
      id: "author_fixture",
      username: "Avery",
      full_name: "Avery Builder",
      first_name: "Avery",
      last_name: "Builder",
      avatar_url: avatarReference,
    }];
    mocks.getSupabaseServerClient.mockResolvedValue(createFeedSupabase());
    mocks.resolveProfileMediaDisplayUrl.mockImplementation(async ({ reference }: { reference: string | null | undefined }) => {
      if (!reference || reference.includes("missing")) return null;
      if (reference.startsWith("https://")) return reference;
      return `https://signed.example/profile-media?reference=${encodeURIComponent(reference)}&token=fresh`;
    });
  });

  it("loads current profile avatar references in the batched author query and resolves each author once", async () => {
    const feed = await getCommunityFeed();
    const expectedDisplayUrl = `https://signed.example/profile-media?reference=${encodeURIComponent(originalAvatarReference)}&token=fresh`;

    expect(feed).toHaveLength(2);
    expect(feed.map((post) => post.author.avatarDisplayUrl)).toEqual([expectedDisplayUrl, expectedDisplayUrl]);
    expect(mocks.resolveProfileMediaDisplayUrl).toHaveBeenCalledTimes(1);
    expect(mocks.resolveProfileMediaDisplayUrl).toHaveBeenCalledWith({
      userId: "author_fixture",
      reference: originalAvatarReference,
      kind: "avatar",
    });
    expect(profileRecords[0].avatar_url).toBe(originalAvatarReference);
    expect(feed[0].author).not.toHaveProperty("avatarReference");
    expect(feed[0]).not.toHaveProperty("avatar_url");
  });

  it("uses a replacement profile avatar for existing posts after Feed reloads without changing post data", async () => {
    const firstLoad = await getCommunityFeed();

    avatarReference = replacementAvatarReference;
    profileRecords = [{ ...profileRecords[0], avatar_url: avatarReference }];
    const reloadedFeed = await getCommunityFeed();

    expect(reloadedFeed.map((post) => post.id)).toEqual(firstLoad.map((post) => post.id));
    expect(firstLoad[0].author.avatarDisplayUrl).toContain(encodeURIComponent(originalAvatarReference));
    expect(reloadedFeed[0].author.avatarDisplayUrl).toContain(encodeURIComponent(replacementAvatarReference));
    expect(mocks.resolveProfileMediaDisplayUrl).toHaveBeenCalledTimes(2);
  });

  it("keeps legacy HTTPS avatars displayable and degrades null or missing private media to initials", async () => {
    const legacyAvatarUrl = "https://images.example.com/legacy-avatar.png";
    profileRecords = [{ ...profileRecords[0], avatar_url: legacyAvatarUrl }];
    const legacyFeed = await getCommunityFeed();
    expect(legacyFeed[0].author.avatarDisplayUrl).toBe(legacyAvatarUrl);

    profileRecords = [{ ...profileRecords[0], avatar_url: null }];
    const noAvatarFeed = await getCommunityFeed();
    expect(noAvatarFeed[0].author.avatarDisplayUrl).toBeNull();

    profileRecords = [{ ...profileRecords[0], avatar_url: originalAvatarReference.replace("11111111", "missing") }];
    const missingMediaFeed = await getCommunityFeed();
    expect(missingMediaFeed[0].author.avatarDisplayUrl).toBeNull();
  });
});
