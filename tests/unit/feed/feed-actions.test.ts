import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
  revalidatePath: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient: mocks.getSupabaseServerClient }));

import {
  createCommunityPost,
  createCommunityPostComment,
  deleteCommunityPost,
  shareCommunityPost,
  shareWebsiteToFeed,
  toggleCommunityPostReaction,
  toggleSavedCommunityPost,
} from "@/app/(app)/feed/actions";

const user = { id: "user_fixture" };

describe("community feed actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue(user);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed project posts before creating a post record", async () => {
    const formData = new FormData();
    formData.set("post_type", "project");
    formData.set("body", "Here is the project.");
    formData.set("project_url", "javascript:alert(1)");

    await expect(createCommunityPost(formData)).resolves.toEqual({ error: "Enter a valid project link." });
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects unrecognized post types before creating a post record", async () => {
    const formData = new FormData();
    formData.set("post_type", "unsupported");
    formData.set("body", "This should not be stored.");

    await expect(createCommunityPost(formData)).resolves.toEqual({ error: "Select a supported post type." });
    expect(mocks.getSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("creates a valid text post and refreshes the feed", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "post_fixture" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });
    const formData = new FormData();
    formData.set("post_type", "text");
    formData.set("title", "Launch note");
    formData.set("body", "The site is live.");
    formData.set("visibility", "public");

    await expect(createCommunityPost(formData)).resolves.toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("community_posts");
    expect(insert).toHaveBeenCalledWith({
      user_id: user.id,
      title: "Launch note",
      body: "The site is live.",
      visibility: "public",
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("records a heart for the signed-in user and refreshes the feed", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(toggleCommunityPostReaction("post_fixture", false)).resolves.toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("community_post_reactions");
    expect(insert).toHaveBeenCalledWith({ post_id: "post_fixture", user_id: user.id, reaction_type: "heart" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("removes an existing heart for the signed-in user", async () => {
    const reactionType = vi.fn().mockResolvedValue({ error: null });
    const userId = vi.fn().mockReturnValue({ eq: reactionType });
    const postId = vi.fn().mockReturnValue({ eq: userId });
    const remove = vi.fn().mockReturnValue({ eq: postId });
    const from = vi.fn().mockReturnValue({ delete: remove });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(toggleCommunityPostReaction("post_fixture", true)).resolves.toEqual({ success: true });
    expect(remove).toHaveBeenCalledOnce();
    expect(reactionType).toHaveBeenCalledWith("reaction_type", "heart");
  });

  it("stores a saved post for the signed-in user and refreshes the feed", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(toggleSavedCommunityPost("post_fixture", true)).resolves.toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("community_saved_items");
    expect(insert).toHaveBeenCalledWith({ user_id: user.id, item_id: "post_fixture", item_type: "post" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("removes a saved post for the signed-in user", async () => {
    const itemType = vi.fn().mockResolvedValue({ error: null });
    const itemId = vi.fn().mockReturnValue({ eq: itemType });
    const userId = vi.fn().mockReturnValue({ eq: itemId });
    const remove = vi.fn().mockReturnValue({ eq: userId });
    const from = vi.fn().mockReturnValue({ delete: remove });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(toggleSavedCommunityPost("post_fixture", false)).resolves.toEqual({ success: true });
    expect(remove).toHaveBeenCalledOnce();
    expect(itemType).toHaveBeenCalledWith("item_type", "post");
  });

  it("adds a comment to an accessible public post", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "post_fixture", user_id: "other_user", visibility: "public" },
      error: null,
    });
    const postId = vi.fn().mockReturnValue({ maybeSingle });
    const postQuery = { select: vi.fn().mockReturnValue({ eq: postId }) };
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => table === "community_posts" ? postQuery : { insert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });
    const formData = new FormData();
    formData.set("post_id", "post_fixture");
    formData.set("body", "Nice work.");

    await expect(createCommunityPostComment(formData)).resolves.toEqual({ success: true });
    expect(insert).toHaveBeenCalledWith({ post_id: "post_fixture", user_id: user.id, body: "Nice work." });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("records an internal share for the signed-in user and refreshes the feed", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(shareCommunityPost("post_fixture")).resolves.toEqual({ success: true });
    expect(from).toHaveBeenCalledWith("community_post_shares");
    expect(insert).toHaveBeenCalledWith({ post_id: "post_fixture", user_id: user.id, share_target: "internal" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

  it("does not share an unpublished website to Feed", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "website_fixture", site_title: "Draft site", visibility: "public", status: "draft" },
      error: null,
    });
    const websiteUserId = vi.fn().mockReturnValue({ maybeSingle });
    const websiteId = vi.fn().mockReturnValue({ eq: websiteUserId });
    const select = vi.fn().mockReturnValue({ eq: websiteId });
    const from = vi.fn().mockReturnValue({ select });
    mocks.getSupabaseServerClient.mockResolvedValue({ from });

    await expect(shareWebsiteToFeed("website_fixture", "Draft site")).resolves.toEqual({
      error: "Publish the website before sharing it to Feed.",
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("website_structures");
  });

  it("deletes the post and cleans up its uploaded attachment objects", async () => {
    const attachmentStorage = { remove: vi.fn().mockResolvedValue({ error: null }) };
    const attachmentQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ storage_path: "user_fixture/post_fixture/image.png" }, { storage_path: "link:https://example.com" }] }),
        }),
      }),
    };
    const deletePost = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const from = vi.fn((table: string) => table === "community_post_attachments" ? attachmentQuery : { delete: deletePost });
    mocks.getSupabaseServerClient.mockResolvedValue({
      from,
      storage: { from: vi.fn().mockReturnValue(attachmentStorage) },
    });

    await expect(deleteCommunityPost("post_fixture")).resolves.toEqual({ success: true });
    expect(deletePost).toHaveBeenCalledOnce();
    expect(attachmentStorage.remove).toHaveBeenCalledWith(["user_fixture/post_fixture/image.png"]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed");
  });

});
