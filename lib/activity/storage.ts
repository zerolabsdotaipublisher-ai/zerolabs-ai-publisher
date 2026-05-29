import "server-only";

import { listManagedWebsites } from "@/lib/management";
import { listOwnedContentSchedules } from "@/lib/scheduling";
import { listSocialAccountConnections } from "@/lib/social/accounts";
import { listOwnedSocialPublishHistoryJobs } from "@/lib/social/history";
import { listOwnedSocialSchedules } from "@/lib/social/scheduling";
import { listSocialPosts } from "@/lib/social/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { PublishingActivityGeneratedContentRow, PublishingActivityStorageSnapshot } from "./types";

const MAX_AGGREGATION_ROWS = 120;

async function listRecentGeneratedContentRows(userId: string): Promise<PublishingActivityGeneratedContentRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_generated_content")
    .select("id, structure_id, content_type, content_status, schedule_state, page_slug, created_at, updated_at")
    .eq("user_id", userId)
    .eq("section_key", "__page__")
    .is("deleted_at", null)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(MAX_AGGREGATION_ROWS);

  if (error) {
    throw error;
  }

  return (data ?? []) as PublishingActivityGeneratedContentRow[];
}

export async function fetchPublishingActivitySnapshot(userId: string): Promise<PublishingActivityStorageSnapshot> {
  const [
    websites,
    contentSchedules,
    socialSchedules,
    socialHistoryResult,
    socialAccounts,
    socialPosts,
    generatedContentRows,
  ] = await Promise.all([
    listManagedWebsites(userId, { status: "all", includeDeleted: false }),
    listOwnedContentSchedules(userId),
    listOwnedSocialSchedules(userId),
    listOwnedSocialPublishHistoryJobs(userId, { page: 1, perPage: MAX_AGGREGATION_ROWS }),
    listSocialAccountConnections(userId),
    listSocialPosts(userId, { limit: MAX_AGGREGATION_ROWS }),
    listRecentGeneratedContentRows(userId),
  ]);

  return {
    websites,
    contentSchedules,
    socialSchedules,
    socialHistory: socialHistoryResult.items,
    socialAccounts,
    socialPosts,
    generatedContentRows,
  };
}
