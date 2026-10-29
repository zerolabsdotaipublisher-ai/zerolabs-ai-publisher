import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getFeedAuthorDisplayName, getFeedAuthorInitials, type FeedAuthorProfile } from "./author";
import type { CommunityPostRecord, CommunitySavedItemRecord, PublicWebsiteRecord } from "./types";

export type PublicCommunityPostSummary = Pick<CommunityPostRecord, "id" | "title" | "body" | "created_at">;

function logOptionalFeedError(label: string, error: { message?: string } | null) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Optional feed data unavailable: ${label}${error?.message ? ` (${error.message})` : ""}`);
  }
}

export async function getCommunityFeed(): Promise<CommunityPostRecord[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("community_posts")
    .select("id, user_id, title, body, visibility, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logOptionalFeedError("community posts", error);
    return [];
  }

  const posts = (data ?? []) as Array<Omit<CommunityPostRecord, "author" | "attachments" | "reactionCount" | "commentCount" | "shareCount" | "reactedByCurrentUser" | "comments">>;
  const ids = posts.map((post) => post.id);
  if (ids.length === 0) return [];

  const authorIds = [...new Set(posts.map((post) => post.user_id))];

  const [authorProfiles, attachments, reactions, comments, shares, currentUser] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, first_name, last_name").in("id", authorIds),
    supabase.from("community_post_attachments").select("id, post_id, attachment_type, storage_path, public_url, file_name, mime_type, file_size, metadata").in("post_id", ids),
    supabase.from("community_post_reactions").select("post_id, user_id").in("post_id", ids),
    supabase.from("community_post_comments").select("id, post_id, user_id, body, created_at").in("post_id", ids).is("deleted_at", null).order("created_at", { ascending: true }),
    supabase.from("community_post_shares").select("post_id").in("post_id", ids),
    supabase.auth.getUser(),
  ]);

  if (authorProfiles.error) {
    logOptionalFeedError("post authors", authorProfiles.error);
  }

  const profilesById = new Map(
    (authorProfiles.data ?? []).map((profile) => {
      const authorProfile = profile as FeedAuthorProfile;
      return [authorProfile.id, authorProfile];
    }),
  );
  const currentUserId = currentUser.data.user?.id;
  const attachmentRows = attachments.error ? [] : await Promise.all((attachments.data ?? []).map(async (row) => {
    const attachment = row as CommunityPostRecord["attachments"][number];
    const storagePath = attachment.storage_path;
    if (!storagePath || attachment.public_url || storagePath.startsWith("website:") || storagePath.startsWith("link:")) return attachment;

    try {
      const signed = await supabase.storage.from("community-attachments").createSignedUrl(storagePath, 3600);
      if (signed.error) logOptionalFeedError("attachment signed URL", signed.error);
      return { ...attachment, public_url: signed.data?.signedUrl ?? null };
    } catch (error) {
      logOptionalFeedError("attachment signed URL", error instanceof Error ? error : null);
      return { ...attachment, public_url: null };
    }
  }));
  const reactionRows = reactions.error ? [] : (reactions.data ?? []);
  const commentRows = comments.error ? [] : (comments.data ?? []);
  const shareRows = shares.error ? [] : (shares.data ?? []);
  const count = (rows: Array<{ post_id?: string }>, id: string) => rows.filter((row) => row.post_id === id).length;

  return posts.map((post) => ({
    ...post,
    author: (() => {
      const profile = profilesById.get(post.user_id);
      const authorProfile = profile ?? {
        id: post.user_id,
        email: currentUserId === post.user_id ? currentUser.data.user?.email : null,
      };

      return {
        id: post.user_id,
        username: profile?.username ?? null,
        displayName: getFeedAuthorDisplayName(authorProfile),
        initials: getFeedAuthorInitials(authorProfile),
      };
    })(),
    attachments: attachmentRows.filter((row) => row.post_id === post.id) as CommunityPostRecord["attachments"],
    reactionCount: reactions.error ? null : count(reactionRows, post.id),
    commentCount: comments.error ? null : count(commentRows, post.id),
    shareCount: shares.error ? null : count(shareRows, post.id),
    reactedByCurrentUser: reactions.error || !currentUserId ? null : reactionRows.some((row) => row.post_id === post.id && row.user_id === currentUserId),
    comments: comments.error ? [] : commentRows.filter((row) => row.post_id === post.id) as CommunityPostRecord["comments"],
  }));
}

export async function getPublicWebsites(): Promise<PublicWebsiteRecord[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("website_structures")
    .select("id, site_title, visibility, updated_at, generated_at, status, user_id")
    .eq("visibility", "public")
    .eq("status", "published")
    .order("generated_at", { ascending: false })
    .limit(10);

  if (error) {
    logOptionalFeedError("public websites", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...(row as Omit<PublicWebsiteRecord, "owner_id"> & { user_id?: string | null }),
    owner_id: (row as { user_id?: string | null }).user_id,
  }));
}

export async function getPublicWebsitesForOwner(userId: string): Promise<PublicWebsiteRecord[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("website_structures")
    .select("id, site_title, visibility, updated_at, generated_at, status, user_id")
    .eq("visibility", "public")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("generated_at", { ascending: false });

  if (error) {
    logOptionalFeedError("current user's public websites", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...(row as Omit<PublicWebsiteRecord, "owner_id"> & { user_id?: string | null }),
    owner_id: (row as { user_id?: string | null }).user_id,
  }));
}

/** Lightweight public-post query for a profile surface; it deliberately excludes private and draft posts. */
export async function getPublicCommunityPostsForAuthor(
  userId: string,
  limit = 3,
): Promise<PublicCommunityPostSummary[]> {
  const supabase = await getSupabaseServerClient();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 6);

  const { data, error } = await supabase
    .from("community_posts")
    .select("id, title, body, created_at")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    logOptionalFeedError("current user's public community posts", error);
    return [];
  }

  return (data ?? []) as PublicCommunityPostSummary[];
}

export async function getSavedCommunityItems(userId: string): Promise<{ items: CommunitySavedItemRecord[]; isAvailable: boolean }> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("community_saved_items")
    .select("item_id, item_type")
    .eq("user_id", userId);

  if (error) {
    logOptionalFeedError("saved community items", error);
    return { items: [], isAvailable: false };
  }

  return { items: (data ?? []) as CommunitySavedItemRecord[], isAvailable: true };
}
