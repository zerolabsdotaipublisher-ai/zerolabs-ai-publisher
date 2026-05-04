import type { DashboardMetricSummary, DashboardStorageSnapshot } from "./types";
import { isAccountAttentionRequired } from "./schema";

export function buildDashboardMetrics(snapshot: DashboardStorageSnapshot): DashboardMetricSummary {
  const publishedWebsites = snapshot.websites.filter((website) => website.status === "published").length;
  const scheduledContent = snapshot.websites.filter(
    (website) => website.schedule?.status === "active" || website.schedule?.status === "running",
  ).length;
  const scheduledSocial = snapshot.socialSchedules.filter((schedule) =>
    ["scheduled", "queued"].includes(schedule.status),
  ).length;
  const failedSchedules =
    snapshot.websites.filter((website) => website.schedule?.status === "failed").length +
    snapshot.socialSchedules.filter((schedule) => ["failed", "retry_pending"].includes(schedule.status)).length;

  const failedPublishes =
    snapshot.websites.filter((website) => website.status === "update_failed").length +
    snapshot.socialHistory.filter((history) => history.status === "failed").length;

  const accountAttention = snapshot.socialAccounts.filter(isAccountAttentionRequired).length;

  return {
    totalWebsites: snapshot.websites.length,
    publishedItems: publishedWebsites + snapshot.generatedContent.published,
    generatedContentCount: snapshot.generatedContent.total + snapshot.socialPosts.length,
    scheduledItems: scheduledContent + scheduledSocial,
    attentionRequiredItems: failedSchedules + failedPublishes + accountAttention,
  };
}
