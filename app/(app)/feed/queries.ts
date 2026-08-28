import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CommunityPostRecord, CommunitySavedItemRecord, PublicWebsiteRecord } from "./types";

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

  const posts = (data ?? []) as CommunityPostRecord[];
  const ids = posts.map((post) => post.id);
  if (ids.length === 0) return [];

  const [attachments, reactions, comments, shares] = await Promise.all([
    supabase.from("community_post_attachments").select("id, post_id, attachment_type, storage_path, public_url, file_name, mime_type, file_size, metadata").in("post_id", ids),
    supabase.from("community_post_reactions").select("post_id, user_id").in("post_id", ids),
    supabase.from("community_post_comments").select("id, post_id, user_id, body, created_at").in("post_id", ids).is("deleted_at", null).order("created_at", { ascending: true }),
    supabase.from("community_post_shares").select("post_id").in("post_id", ids),
  ]);

  const currentUser = await supabase.auth.getUser();
  const currentUserId = currentUser.data.user?.id;
  const attachmentRows = attachments.error ? [] : await Promise.all((attachments.data ?? []).map(async (row) => {
    const attachment = row as CommunityPostRecord["attachments"][number];
    if (attachment.public_url || attachment.storage_path.startsWith("website:") || attachment.storage_path.startsWith("link:")) return attachment;
    const signed = await supabase.storage.from("community-attachments").createSignedUrl(attachment.storage_path, 3600);
    return { ...attachment, public_url: signed.data?.signedUrl ?? null };
  }));
  const reactionRows = reactions.error ? [] : (reactions.data ?? []);
  const commentRows = comments.error ? [] : (comments.data ?? []);
  const shareRows = shares.error ? [] : (shares.data ?? []);
  const count = (rows: Array<{ post_id?: string }>, id: string) => rows.filter((row) => row.post_id === id).length;

  return posts.map((post) => ({
    ...post,
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

export async function getSavedCommunityItems(userId: string): Promise<CommunitySavedItemRecord[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("community_saved_items")
    .select("item_id, item_type")
    .eq("user_id", userId);

  if (error) {
    logOptionalFeedError("saved community items", error);
    return [];
  }

  return (data ?? []) as CommunitySavedItemRecord[];
}
