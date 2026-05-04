import { routes } from "@/config/routes";
import { buildDashboardRecentActivity } from "./activity";
import { buildDashboardAlerts } from "./alerts";
import { DASHBOARD_MVP_BOUNDARIES, DASHBOARD_QUICK_ACTIONS, isAccountAttentionRequired } from "./schema";
import { fetchDashboardStorageSnapshot } from "./storage";
import { buildDashboardMetrics } from "./metrics";
import type { DashboardSummary } from "./types";

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
  const snapshot = await fetchDashboardStorageSnapshot(options.userId);
  const websitesByRecentUpdate = [...snapshot.websites].sort(
    (left, right) => new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime(),
  );

  const websiteSummary = {
    total: snapshot.websites.length,
    published: snapshot.websites.filter((website) => website.status === "published").length,
    draft: snapshot.websites.filter((website) => website.status === "draft").length,
    archived: snapshot.websites.filter((website) => website.status === "archived").length,
    attentionRequired: snapshot.websites.filter((website) => website.status === "update_failed").length,
    recentlyUpdated: websitesByRecentUpdate.slice(0, 6).map((website) => ({
      id: website.id,
      title: website.title,
      status: website.status,
      updatedAt: website.lastUpdatedAt,
      href: website.generatedSitePath,
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
        (website) => website.schedule?.status === "active" || website.schedule?.status === "running",
      ).length,
  };

  const socialSummary = {
    connectedAccounts: snapshot.socialAccounts.filter((account) => account.status === "connected").length,
    accountsNeedingAttention: snapshot.socialAccounts.filter(isAccountAttentionRequired).length,
    generatedPosts: snapshot.socialPosts.length,
    scheduledPosts: snapshot.socialSchedules.filter((schedule) =>
      ["scheduled", "queued", "retry_pending"].includes(schedule.status),
    ).length,
    publishedPosts: snapshot.socialPosts.filter((post) => Boolean(post.publishedAt)).length,
    failedPublishes: snapshot.socialHistory.filter((history) => history.status === "failed").length,
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
    mvpBoundaries: [...DASHBOARD_MVP_BOUNDARIES],
  };
}

export function isDashboardSummaryEmpty(summary: DashboardSummary): boolean {
  return (
    summary.metrics.totalWebsites === 0 &&
    summary.metrics.generatedContentCount === 0 &&
    summary.socialSummary.generatedPosts === 0 &&
    summary.socialSummary.connectedAccounts === 0
  );
}

export function getDefaultDashboardErrorMessage(): string {
  return "Unable to load dashboard summary right now. Please retry.";
}

export function getDashboardFallbackHref(): string {
  return routes.websites;
}
