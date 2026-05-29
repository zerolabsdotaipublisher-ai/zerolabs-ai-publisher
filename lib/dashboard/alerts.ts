import { routes } from "@/config/routes";
import { isAccountAttentionRequired } from "./schema";
import type { DashboardAlert, DashboardStorageSnapshot } from "./types";

export function buildDashboardAlerts(snapshot: DashboardStorageSnapshot): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  const failedWebsitePublishes = snapshot.websites.filter((website) => website.status === "failed").length;
  if (failedWebsitePublishes > 0) {
    alerts.push({
      id: "failed-website-publishes",
      severity: "error",
      title: "Failed website publishes detected",
      detail: `${failedWebsitePublishes} website publish/update operations need attention.`,
      actionLabel: "Review websites",
      actionHref: routes.websites,
    });
  }

  const failedSocialPublishes = snapshot.socialHistory.filter((history) => history.status === "failed").length;
  if (failedSocialPublishes > 0) {
    alerts.push({
      id: "failed-social-publishes",
      severity: "error",
      title: "Failed social publishes detected",
      detail: `${failedSocialPublishes} social publish jobs failed in recent history.`,
      actionLabel: "Review social history",
      actionHref: routes.websites,
    });
  }

  const failedSchedules =
    snapshot.websites.filter((website) => website.schedule?.status === "failed").length +
    snapshot.socialSchedules.filter((schedule) => ["failed", "retry_pending"].includes(schedule.status)).length;
  if (failedSchedules > 0) {
    alerts.push({
      id: "failed-schedules",
      severity: "warning",
      title: "Schedule failures need review",
      detail: `${failedSchedules} content/social schedules are failed or retry pending.`,
      actionLabel: "Review schedules",
      actionHref: routes.websites,
    });
  }

  const accountsNeedingReauth = snapshot.socialAccounts.filter(isAccountAttentionRequired).length;
  if (accountsNeedingReauth > 0) {
    alerts.push({
      id: "social-account-reauth",
      severity: "warning",
      title: "Social account reauthorization required",
      detail: `${accountsNeedingReauth} connected account(s) need token refresh or reconnection.`,
      actionLabel: "Manage accounts",
      actionHref: routes.websites,
    });
  }

  if (snapshot.socialAccounts.length === 0) {
    alerts.push({
      id: "missing-social-account",
      severity: "info",
      title: "No social account connected",
      detail: "Connect an Instagram account to enable social scheduling and publishing workflows.",
      actionLabel: "Connect account",
      actionHref: `/api/social/accounts/connect/instagram?returnTo=${encodeURIComponent(routes.dashboard)}`,
    });
  }

  return alerts;
}
