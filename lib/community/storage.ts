import "server-only";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { CommunityPost, CommunitySavedItem, CreateCommunityPostParams, SaveCommunityItemParams } from "./types";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { routes } from "@/config/routes";

export async function createCommunityPost(params: CreateCommunityPostParams): Promise<CommunityPost | null> {
  const user = await requireUser(routes.dashboard);
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("community_posts")
    .insert([
      {
        user_id: user.id,
        title: params.title,
        content: params.content,
        visibility: params.visibility,
      },
    ])
    .select()
    .single();

  if (error) {
    logger.error("Failed to create community post", { error });
    throw new Error("Failed to create post");
  }

  return data as CommunityPost;
}

export async function listPublicCommunityPosts(): Promise<CommunityPost[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("community_posts")
    .select("*, profiles:user_id(full_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    logger.error("Failed to list public community posts", { error });
    return [];
  }

  return data.map((row: Record<string, unknown> & { profiles?: { full_name?: string } }) => ({
    ...row,
    author_name: row.profiles?.full_name,
  })) as CommunityPost[];
}

export async function listUserCommunityPosts(): Promise<CommunityPost[]> {
  const user = await requireUser(routes.dashboard);
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list user community posts", { error });
    return [];
  }

  return data as CommunityPost[];
}

export async function saveCommunityItem(params: SaveCommunityItemParams): Promise<CommunitySavedItem | null> {
  const user = await requireUser(routes.dashboard);
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("community_saved_items")
    .insert([
      {
        user_id: user.id,
        content_id: params.content_id,
        content_type: params.content_type,
      },
    ])
    .select()
    .single();

  if (error) {
    logger.error("Failed to save community item", { error });
    throw new Error("Failed to save item");
  }

  return data as CommunitySavedItem;
}

export async function unsaveCommunityItem(params: SaveCommunityItemParams): Promise<void> {
  const user = await requireUser(routes.dashboard);
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("community_saved_items")
    .delete()
    .match({
      user_id: user.id,
      content_id: params.content_id,
      content_type: params.content_type,
    });

  if (error) {
    logger.error("Failed to unsave community item", { error });
    throw new Error("Failed to unsave item");
  }
}

export async function listUserSavedItems(): Promise<CommunitySavedItem[]> {
  const user = await requireUser(routes.dashboard);
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("community_saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list user saved items", { error });
    return [];
  }

  return data as CommunitySavedItem[];
}
