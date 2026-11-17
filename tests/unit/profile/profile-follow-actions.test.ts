import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  revalidatePath: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  getServerUser: mocks.getServerUser,
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}));
vi.mock("@/lib/observability", () => ({ logger: { warn: mocks.loggerWarn } }));

import { followProfile, unfollowProfile } from "@/app/(app)/profile/actions";

describe("profile follow server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerUser.mockResolvedValue({ id: "viewer_user" });
  });

  it("follows using only the authenticated viewer ID and revalidates relationship views", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(followProfile("profile_user")).resolves.toEqual({ success: true });

    expect(from).toHaveBeenCalledWith("profile_follows");
    expect(upsert).toHaveBeenCalledWith(
      { follower_user_id: "viewer_user", followed_user_id: "profile_user" },
      { onConflict: "follower_user_id,followed_user_id", ignoreDuplicates: true },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("treats a concurrent duplicate follow as idempotent success", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
    mocks.getSupabaseServerClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ upsert }) });

    await expect(followProfile("profile_user")).resolves.toEqual({ success: true });
  });

  it("rejects self-follow and unauthenticated follow attempts before a database mutation", async () => {
    await expect(followProfile("viewer_user")).resolves.toEqual({ error: "You cannot follow your own profile." });
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();

    mocks.getServerUser.mockResolvedValueOnce(null);
    await expect(followProfile("profile_user")).resolves.toEqual({ error: "Sign in to follow profiles." });
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("unfollows only the authenticated viewer's outgoing relationship", async () => {
    const followedUser = vi.fn().mockResolvedValue({ error: null });
    const followerUser = vi.fn().mockReturnValue({ eq: followedUser });
    const remove = vi.fn().mockReturnValue({ eq: followerUser });
    const from = vi.fn().mockReturnValue({ delete: remove });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(unfollowProfile("profile_user")).resolves.toEqual({ success: true });

    expect(remove).toHaveBeenCalledOnce();
    expect(followerUser).toHaveBeenCalledWith("follower_user_id", "viewer_user");
    expect(followedUser).toHaveBeenCalledWith("followed_user_id", "profile_user");
    expect(followedUser).not.toHaveBeenCalledWith("follower_user_id", "profile_user");
  });
});
