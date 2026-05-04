import { routes } from "@/config/routes";
import { DASHBOARD_MAX_RECENT_ACTIVITY } from "./schema";
import type { DashboardRecentActivityItem, DashboardStorageSnapshot } from "./types";

function toWebsiteActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  return snapshot.websites.slice(0, 8).map((website) => ({
    id: `website_${website.id}_${website.lastUpdatedAt}`,
    type: "website_update",
    title: website.title,
    detail: `Website status: ${website.status}`,
    timestamp: website.lastUpdatedAt,
    status: website.status === "update_failed" ? "error" : "info",
    href: website.generatedSitePath,
  }));
}

function toPublishActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  const websitePublishes = snapshot.websites
    .filter((website) => Boolean(website.lastPublishedAt))
    .map((website) => ({
      id: `publish_website_${website.id}_${website.lastPublishedAt}`,
      type: "publish_event" as const,
      title: website.title,
      detail: "Website published",
      timestamp: website.lastPublishedAt as string,
      status: "success" as const,
      href: website.generatedSitePath,
    }));

  const socialPublishes = snapshot.socialHistory.slice(0, 10).map((history) => ({
    id: `publish_social_${history.id}_${history.updatedAt}`,
    type: "social_publish" as const,
    title: `Social publish (${history.platform})`,
    detail: `Status: ${history.status}`,
    timestamp: history.updatedAt,
    status: history.status === "failed" ? "error" : history.status === "published" ? "success" : "info",
    href: routes.websites,
  }));

  return [...websitePublishes, ...socialPublishes];
}

function toContentActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  return snapshot.generatedContent.rows.slice(0, 10).map((row) => ({
    id: `content_${row.id}_${row.updated_at}`,
    type: "content_generation",
    title: `Generated ${row.content_type} content`,
    detail: `Page: ${row.page_slug}`,
    timestamp: row.updated_at,
    status: "info",
    href: routes.websites,
  }));
}

function toSocialScheduleActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  return snapshot.socialSchedules.slice(0, 8).map((schedule) => ({
    id: `social_schedule_${schedule.id}_${schedule.updatedAt}`,
    type: "social_schedule",
    title: schedule.title,
    detail: `Schedule status: ${schedule.status}`,
    timestamp: schedule.updatedAt,
    status: schedule.status === "failed" ? "error" : schedule.status === "retry_pending" ? "warning" : "info",
    href: routes.websites,
  }));
}

function toAccountActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  return snapshot.socialAccounts.slice(0, 8).map((account) => ({
    id: `account_${account.id}_${account.updatedAt}`,
    type: "account_event",
    title: `${account.platform} account`,
    detail: `Connection status: ${account.status}`,
    timestamp: account.updatedAt,
    status:
      account.reauthorizationRequired || ["expired", "invalid", "reauthorization_required"].includes(account.status)
        ? "warning"
        : "info",
    href: routes.websites,
  }));
}

export function buildDashboardRecentActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  const items = [
    ...toWebsiteActivity(snapshot),
    ...toPublishActivity(snapshot),
    ...toContentActivity(snapshot),
    ...toSocialScheduleActivity(snapshot),
    ...toAccountActivity(snapshot),
  ];

  return items
    .filter((entry) => Boolean(entry.timestamp))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, DASHBOARD_MAX_RECENT_ACTIVITY);
}
