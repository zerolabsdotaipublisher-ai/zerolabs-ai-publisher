import type { GeneratedSocialPost } from "@/lib/social/types";
import type { WebsiteManagementRecord } from "@/lib/management";
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
    return count ?? 0;
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
    return [];
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
      listManagedWebsites(userId, { status: "all", includeDeleted: false }).catch(e => {
        logger.error("listManagedWebsites failed", { error: e });
        return [];
      }),
      listOwnedSocialSchedules(userId).catch(e => {
        logger.error("listOwnedSocialSchedules failed", { error: e });
        return [];
      }),
      listSocialPosts(userId, { limit: 100 }).catch(e => {
        logger.error("listSocialPosts failed", { error: e });
        return [];
      }),
      listOwnedSocialPublishHistoryJobs(userId, { page: 1, perPage: 25 }).catch(e => {
        logger.error("listOwnedSocialPublishHistoryJobs failed", { error: e });
        return { items: [], page: 1, perPage: 25, totalCount: 0 };
      }),
      listSocialAccountConnections(userId).catch(e => {
        logger.error("listSocialAccountConnections failed", { error: e });
        return [];
      }),
      getGeneratedContentStats(userId).catch(e => {
        logger.error("getGeneratedContentStats failed", { error: e });
        return { total: 0, website: 0, blog: 0, article: 0, published: 0, scheduled: 0, rows: [] };
      }),
    ]);

  return {
    websites: websites ,
    socialSchedules: socialSchedules ,
    socialPosts: socialPosts ,
    socialHistory: (socialHistoryResult ).items || [],
    socialAccounts: socialAccounts ,
    generatedContent: generatedContent ,
  };
}
