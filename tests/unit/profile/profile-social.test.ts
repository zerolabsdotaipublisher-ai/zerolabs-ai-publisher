import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}));
vi.mock("@/lib/observability", () => ({
  logger: { warn: mocks.loggerWarn },
}));

import { getProfileSocialStats } from "@/lib/profile-social";

type Counts = {
  followers: number | null;
  following: number | null;
};

function socialStatsClient(counts: Counts) {
  const eq = vi.fn((column: string, userId: string) => Promise.resolve({
    data: null,
    count: column === "followed_user_id" ? counts.followers : counts.following,
    error: null,
    userId,
  }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return { client: { from }, from, select, eq };
}

describe("profile social statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero followers and zero following for a profile without relationship rows", async () => {
    const query = socialStatsClient({ followers: 0, following: 0 });
    mocks.getSupabaseServerClient.mockResolvedValue(query.client);

    await expect(getProfileSocialStats("viewed_profile")).resolves.toEqual({
      followersCount: 0,
      followingCount: 0,
    });
  });

  it("returns exact follower and following counts, including multiple followers", async () => {
    const query = socialStatsClient({ followers: 24, following: 18 });
    mocks.getSupabaseServerClient.mockResolvedValue(query.client);

    await expect(getProfileSocialStats("viewed_profile")).resolves.toEqual({
      followersCount: 24,
      followingCount: 18,
    });
    expect(query.from).toHaveBeenCalledTimes(2);
    expect(query.from).toHaveBeenNthCalledWith(1, "profile_follows");
    expect(query.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
  });

  it("counts the viewed profile rather than a separate viewer identity", async () => {
    const query = socialStatsClient({ followers: 3, following: 7 });
    mocks.getSupabaseServerClient.mockResolvedValue(query.client);

    await getProfileSocialStats("viewed_profile");

    expect(query.eq).toHaveBeenCalledWith("followed_user_id", "viewed_profile");
    expect(query.eq).toHaveBeenCalledWith("follower_user_id", "viewed_profile");
    expect(query.eq).not.toHaveBeenCalledWith(expect.any(String), "viewer_user");
  });

  it("treats an empty exact-count response as zero for legacy profiles without rows", async () => {
    const query = socialStatsClient({ followers: null, following: null });
    mocks.getSupabaseServerClient.mockResolvedValue(query.client);

    await expect(getProfileSocialStats("legacy_profile")).resolves.toEqual({
      followersCount: 0,
      followingCount: 0,
    });
  });
});
