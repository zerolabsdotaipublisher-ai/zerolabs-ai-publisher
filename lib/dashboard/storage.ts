import "server-only";

import { logger } from "@/lib/observability";
import { listManagedWebsites } from "@/lib/management";
import { listSocialAccountConnections } from "@/lib/social/accounts/workflow";
import { listOwnedSocialPublishHistoryJobs } from "@/lib/social/history";
import { listOwnedSocialSchedules } from "@/lib/social/scheduling";
import { listSocialPosts } from "@/lib/social/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { DashboardGeneratedContentRow, DashboardGeneratedContentStats, DashboardStorageSnapshot } from "./types";

async function countGeneratedContentRows(
  userId: string,
  contentType?: "website" | "blog" | "article",
  contentStatus?: "published" | "scheduled",
): Promise<number> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("website_generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("section_key", "__page__")
    .is("deleted_at", null)
    .eq("is_archived", false);

  if (contentType) {
    query = query.eq("content_type", contentType);
  }

  if (contentStatus) {
    query = query.eq("content_status", contentStatus);
  }

  const { count, error } = await query;
  if (error) {
    logger.error("Failed counting generated content rows for dashboard", {
      category: "error",
      service: "supabase",
      userId,
      metadata: { contentType, contentStatus },
      error: { name: "DashboardGeneratedContentCountError", message: error.message },
    });
    throw error;
  }

  return count ?? 0;
}

async function listRecentGeneratedContentRows(userId: string): Promise<DashboardGeneratedContentRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_generated_content")
    .select("id, structure_id, content_type, content_status, schedule_state, page_slug, created_at, updated_at")
    .eq("user_id", userId)
    .eq("section_key", "__page__")
    .is("deleted_at", null)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    logger.error("Failed loading recent generated content rows for dashboard", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "DashboardGeneratedContentListError", message: error.message },
    });
    throw error;
  }

  return (data ?? []) as DashboardGeneratedContentRow[];
}

async function getGeneratedContentStats(userId: string): Promise<DashboardGeneratedContentStats> {
  const [total, website, blog, article, published, scheduled, rows] = await Promise.all([
    countGeneratedContentRows(userId),
    countGeneratedContentRows(userId, "website"),
    countGeneratedContentRows(userId, "blog"),
    countGeneratedContentRows(userId, "article"),
    countGeneratedContentRows(userId, undefined, "published"),
    countGeneratedContentRows(userId, undefined, "scheduled"),
    listRecentGeneratedContentRows(userId),
  ]);

  return {
    total,
    website,
    blog,
    article,
    published,
    scheduled,
    rows,
  };
}

export async function fetchDashboardStorageSnapshot(userId: string): Promise<DashboardStorageSnapshot> {
  const [websites, socialSchedules, socialPosts, socialHistoryResult, socialAccounts, generatedContent] =
    await Promise.all([
      listManagedWebsites(userId, { status: "all", includeDeleted: false }),
      listOwnedSocialSchedules(userId),
      listSocialPosts(userId, { limit: 100 }),
      listOwnedSocialPublishHistoryJobs(userId, { page: 1, perPage: 25 }),
      listSocialAccountConnections(userId),
      getGeneratedContentStats(userId),
    ]);

  return {
    websites,
    socialSchedules,
    socialPosts,
    socialHistory: socialHistoryResult.items,
    socialAccounts,
    generatedContent,
  };
}
