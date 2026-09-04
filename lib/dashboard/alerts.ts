import { routes } from "@/config/routes";
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

  const failedSchedules = snapshot.websites.filter((website) => website.schedule?.status === "failed").length;
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

  return alerts;
}
