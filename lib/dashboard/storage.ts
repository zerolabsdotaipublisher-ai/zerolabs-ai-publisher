import "server-only";

import { logger } from "@/lib/observability";
import { listManagedWebsites } from "@/lib/management";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { DashboardStorageSnapshot, DashboardWebsiteShareActivity } from "./types";

async function loadOptionalDashboardData<T>(label: string, load: Promise<T>, fallback: T): Promise<T> {
  try {
    return await load;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.info(`Optional dashboard data unavailable: ${label}`, {
        category: "config",
        service: "dashboard",
        error: { name: "OptionalDashboardDataError", message: error instanceof Error ? error.message : String(error) },
      });
    }

    return fallback;
  }
}

async function listOptionalWebsiteShares(userId: string): Promise<DashboardWebsiteShareActivity[]> {
  const supabase = getSupabaseServiceClient();
  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) throw postsError;
  const postRows = (posts ?? []) as Array<{ id: string; title?: string | null; created_at: string }>;
  if (postRows.length === 0) return [];

  const { data: attachments, error: attachmentsError } = await supabase
    .from("community_post_attachments")
    .select("id, post_id, metadata")
    .in("post_id", postRows.map((post) => post.id));

  if (attachmentsError) throw attachmentsError;
  const postMap = new Map(postRows.map((post) => [post.id, post]));

  return ((attachments ?? []) as Array<{ id: string; post_id: string; metadata?: Record<string, unknown> | null }>)
    .map((attachment) => {
      const websiteId = typeof attachment.metadata?.website_id === "string" ? attachment.metadata.website_id : null;
      const post = postMap.get(attachment.post_id);
      return websiteId && post ? { id: attachment.id, websiteId, postTitle: post.title ?? null, sharedAt: post.created_at } : null;
    })
    .filter((share): share is DashboardWebsiteShareActivity => share !== null);
}

export async function fetchDashboardStorageSnapshot(userId: string): Promise<DashboardStorageSnapshot> {
  const [websites, websiteShares] = await Promise.all([
    listManagedWebsites(userId, { includeSchedules: false, status: "all", includeDeleted: false }),
    loadOptionalDashboardData("website shares", listOptionalWebsiteShares(userId), []),
  ]);

  return {
    websites,
    websiteShares,
  };
}
