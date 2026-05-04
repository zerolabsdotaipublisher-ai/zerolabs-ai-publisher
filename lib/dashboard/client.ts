import type { DashboardSummary } from "./types";

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
