import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { GeneratedSocialPost, SocialPostRow, SocialPostStatus } from "./types";

function deriveSocialPostStatus(post: GeneratedSocialPost): SocialPostStatus {
  if (post.publishedAt) {
    return "published";
  }
  if (post.scheduledPublishAt) {
    return "scheduled";
  }
  if (post.version > 1) {
    return "edited";
  }
  return "generated";
}

function toRow(
  post: GeneratedSocialPost,
  userId: string,
  status = deriveSocialPostStatus(post),
): SocialPostRow {
  return {
    id: post.id,
    user_id: userId,
    structure_id: post.structureId ?? null,
    topic: post.topic,
    title: post.title,
    source_type: post.sourceType,
    social_json: post,
    source_input: {
      topic: post.topic,
      keywords: post.sharedKeywords,
      campaignGoal: post.requirements.campaignGoal,
      audience: post.requirements.audience,
      tone: post.requirements.tone,
      optionalUrl: post.variants.find((variant) => variant.link)?.link,
      sourceContent: {
        type: post.sourceType,
        structureId: post.structureId,
        ...post.sourceSnapshot,
      },
      platforms: post.requirements.platforms,
      hashtagStyle: post.requirements.hashtagStyle,
      includeEmoji: post.requirements.includeEmoji,
      maxHashtags: post.requirements.maxHashtags,
    },
    content_status: status,
    version: post.version,
    regeneration_count: post.regenerationCount,
    created_by: userId,
    updated_by: userId,
    archived_at: null,
    deleted_at: null,
    generated_at: post.generatedAt,
    updated_at: post.updatedAt,
    scheduled_publish_at: post.scheduledPublishAt ?? null,
    published_at: post.publishedAt ?? null,
  } as SocialPostRow;
}

function fromRow(row: SocialPostRow): GeneratedSocialPost {
  return row.social_json as GeneratedSocialPost;
}

export async function upsertSocialPost(post: GeneratedSocialPost, userId: string): Promise<GeneratedSocialPost> {
  const supabase = getSupabaseServiceClient();
  const status = deriveSocialPostStatus(post);
  const row = toRow(post, userId, status);

  const { error } = await supabase.from("social_posts").upsert(row, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store social post", {
      category: "error",
      service: "supabase",
      structureId: post.structureId,
      error: { name: "SocialStorageError", message: error.message },
    });
    throw error;
  }

  return post;
}

export async function getSocialPostById(postId: string, userId: string): Promise<GeneratedSocialPost | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    logger.error("Failed to load social post", {
      category: "error",
      service: "supabase",
      error: { name: "SocialStorageError", message: error.message },
      metadata: { postId },
    });
    throw error;
  }

  return fromRow(data as SocialPostRow);
}

export async function listSocialPosts(
  userId: string,
  options: { structureId?: string; limit?: number } = {},
): Promise<GeneratedSocialPost[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("social_posts")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.structureId) {
    query = query.eq("structure_id", options.structureId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to list social posts", {
      category: "error",
      service: "supabase",
      userId,
      structureId: options.structureId,
      error: { name: "SocialStorageError", message: error.message },
    });
    throw error;
  }

  return (data as SocialPostRow[]).map(fromRow);
}

export async function listSocialPostsByStructureId(
  structureId: string,
  userId: string,
): Promise<GeneratedSocialPost[]> {
  return listSocialPosts(userId, { structureId, limit: 100 });
}

export async function deleteSocialPostsByStructureId(structureId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("social_posts")
    .update({
      content_status: "deleted",
      archived_at: now,
      deleted_at: now,
      updated_by: userId,
      updated_at: now,
    })
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to delete social posts", {
      category: "error",
      service: "supabase",
      structureId,
      error: { name: "SocialStorageError", message: error.message },
    });
    throw error;
  }
}
