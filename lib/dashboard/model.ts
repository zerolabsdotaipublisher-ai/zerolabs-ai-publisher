import { routes } from "@/config/routes";
import { listOwnedReviewRecords } from "@/lib/review/storage";
import { buildDashboardRecentActivity } from "./activity";
import { buildDashboardAlerts } from "./alerts";
import { DASHBOARD_MVP_BOUNDARIES, DASHBOARD_QUICK_ACTIONS, isAccountAttentionRequired } from "./schema";
import { fetchDashboardStorageSnapshot } from "./storage";
import { buildDashboardMetrics } from "./metrics";
import { listPublicCommunityPosts, listUserCommunityPosts, listUserSavedItems } from "@/lib/community/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "./types";
export { isDashboardSummaryEmpty, getDefaultDashboardErrorMessage } from "./client";

interface BuildDashboardSummaryOptions {
  userId: string;
  email: string;
  displayName?: string;
}

export function getDashboardUserDisplayName(userMetadata: unknown): string | undefined {
  if (!userMetadata || typeof userMetadata !== "object") {
    return undefined;
  }

  const value = (userMetadata as { full_name?: unknown }).full_name;
  return typeof value === "string" ? value : undefined;
}

export async function buildDashboardSummary(options: BuildDashboardSummaryOptions): Promise<DashboardSummary> {
  const supabase = getSupabaseServiceClient();
  const [snapshot, reviewRecords, publicCommunityPosts, myCommunityPosts, savedItems, publicWebsites] = await Promise.all([
    fetchDashboardStorageSnapshot(options.userId),
    listOwnedReviewRecords(options.userId).catch((e: any) => []),
    listPublicCommunityPosts().catch((e: any) => []),
    listUserCommunityPosts().catch((e: any) => []),
    listUserSavedItems().catch((e: any) => []),
    (async () => { try { const r = await supabase.from('website_structures').select('*').eq('status', 'live').limit(10); return r.data || []; } catch(e) { return []; } })(),
  ]);
  const websitesByRecentUpdate = [...snapshot.websites].sort(
    (left, right) => new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime(),
  );

  const websiteSummary = {
    total: snapshot.websites.length,
    published: snapshot.websites.filter((website: any) => website.status === "live").length,
    draft: snapshot.websites.filter((website: any) => website.status === "draft").length,
    archived: snapshot.websites.filter((website: any) => website.status === "archived").length,
    attentionRequired: snapshot.websites.filter((website: any) => website.status === "failed").length,
    recentlyUpdated: websitesByRecentUpdate.slice(0, 6).map((website: any) => ({
      id: website.id,
      title: website.title,
      status: website.status,
      publishStatus: website.publishStatus,
      updatedAt: website.lastUpdatedAt,
      publishedAt: website.lastPublishedAt,
      href: website.generatedSitePath,
      previewPath: routes.previewSite(website.id),
      editorPath: routes.editorSite(website.id),
    })),
  };

  const contentSummary = {
    totalGenerated: snapshot.generatedContent.total,
    websiteGenerated: snapshot.generatedContent.website,
    blogGenerated: snapshot.generatedContent.blog,
    articleGenerated: snapshot.generatedContent.article,
    publishedContent: snapshot.generatedContent.published,
    scheduledContent:
      snapshot.generatedContent.scheduled +
      snapshot.websites.filter(
        (website: any) => website.schedule?.status === "active" || website.schedule?.status === "running",
      ).length,
    pendingApproval: reviewRecords.filter((record: any) => record.state === "pending_review").length,
  };

  const socialSummary = {
    connectedAccounts: snapshot.socialAccounts.filter((account: any) => account.status === "connected").length,
    accountsNeedingAttention: snapshot.socialAccounts.filter(isAccountAttentionRequired).length,
    generatedPosts: snapshot.socialPosts.length,
    scheduledPosts: snapshot.socialSchedules.filter((schedule: any) =>
      ["scheduled", "queued", "retry_pending"].includes(schedule.status),
    ).length,
    publishedPosts: snapshot.socialPosts.filter((post: any) => Boolean(post.publishedAt)).length,
    failedPublishes: snapshot.socialHistory.filter((history: any) => history.status === "failed").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: options.userId,
      email: options.email,
      displayName: options.displayName,
    },
    metrics: buildDashboardMetrics(snapshot),
    quickActions: DASHBOARD_QUICK_ACTIONS,
    recentActivity: buildDashboardRecentActivity(snapshot),
    websiteSummary,
    contentSummary,
    socialSummary,
        alerts: buildDashboardAlerts(snapshot),
    publicWebsites: publicWebsites,
    communityPosts: publicCommunityPosts,
    userCommunityPosts: myCommunityPosts,
    savedItemIds: savedItems.map((item: any) => item.content_id),
    mvpBoundaries: [...DASHBOARD_MVP_BOUNDARIES],
  };
}

export function getDashboardFallbackHref(): string {
  return routes.websites;
}
