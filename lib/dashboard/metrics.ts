import type { DashboardMetricSummary, DashboardStorageSnapshot, DashboardWebsiteSummary } from "./types";

export function buildDashboardMetrics(
  snapshot: DashboardStorageSnapshot,
  websiteSummary: Pick<DashboardWebsiteSummary, "total" | "draft" | "published" | "storedPages" | "storedVersions">,
  engagementSummary: Pick<DashboardMetricSummary, "totalViews" | "totalHearts">,
): DashboardMetricSummary {
  const scheduledContent = snapshot.websites.filter(
    (website) => website.schedule?.status === "active" || website.schedule?.status === "running",
  ).length;
  const failedSchedules =
    snapshot.websites.filter((website) => website.schedule?.status === "failed").length;

  const failedPublishes = snapshot.websites.filter((website) => website.status === "failed").length;

  return {
    totalWebsites: websiteSummary.total,
    draftWebsites: websiteSummary.draft,
    publishedWebsites: websiteSummary.published,
    totalViews: engagementSummary.totalViews,
    totalHearts: engagementSummary.totalHearts,
    storedPages: websiteSummary.storedPages,
    storedVersions: websiteSummary.storedVersions,
    publishedItems: websiteSummary.published,
    generatedContentCount: 0,
    scheduledItems: scheduledContent,
    attentionRequiredItems: failedSchedules + failedPublishes,
  };
}
