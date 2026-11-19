import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type WebsiteShareRow = {
  id?: string | null;
  user_id?: string | null;
  visibility?: string | null;
  status?: string | null;
  deleted_at?: string | null;
};

type FeedAttachmentRow = {
  post_id?: string | null;
};

/**
 * Checks the durable Feed share, rather than trusting a URL supplied by the
 * client. A design is visible through `/site/[id]` only when its owner has a
 * current public website record and a public Feed attachment for that record.
 */
export async function canViewFeedSharedWebsiteDesign(websiteId: string): Promise<boolean> {
  const normalizedWebsiteId = websiteId.trim();
  if (!normalizedWebsiteId) return false;

  try {
    const supabase = getSupabaseServiceClient();
    const { data: websiteData, error: websiteError } = await supabase
      .from("website_structures")
      .select("id, user_id, visibility, status, deleted_at")
      .eq("id", normalizedWebsiteId)
      .maybeSingle();

    if (websiteError || !websiteData) return false;
    const website = websiteData as WebsiteShareRow;
    if (
      website.id !== normalizedWebsiteId
      || !website.user_id
      || website.visibility !== "public"
      || website.status === "deleted"
      || website.deleted_at
    ) {
      return false;
    }

    const [sentinelAttachments, metadataAttachments] = await Promise.all([
      supabase
        .from("community_post_attachments")
        .select("post_id")
        .eq("user_id", website.user_id)
        .eq("storage_path", `website:${normalizedWebsiteId}`),
      supabase
        .from("community_post_attachments")
        .select("post_id")
        .eq("user_id", website.user_id)
        .contains("metadata", { website_id: normalizedWebsiteId }),
    ]);

    if (sentinelAttachments.error || metadataAttachments.error) return false;
    const postIds = [...new Set([
      ...(sentinelAttachments.data ?? []),
      ...(metadataAttachments.data ?? []),
    ].map((attachment) => (attachment as FeedAttachmentRow).post_id)
      .filter((postId): postId is string => typeof postId === "string" && postId.length > 0))];
    if (postIds.length === 0) return false;

    const { data: publicPost, error: publicPostError } = await supabase
      .from("community_posts")
      .select("id")
      .in("id", postIds)
      .eq("visibility", "public")
      .limit(1)
      .maybeSingle();

    return !publicPostError && Boolean(publicPost);
  } catch (error) {
    logger.warn("Feed-shared website access check failed", {
      category: "error",
      service: "supabase",
      structureId: normalizedWebsiteId,
      error: {
        name: "FeedSharedWebsiteAccessError",
        message: error instanceof Error ? error.message : "Unknown Feed-shared website access error",
      },
    });
    return false;
  }
}
