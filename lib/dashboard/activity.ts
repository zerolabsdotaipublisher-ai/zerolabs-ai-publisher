import { routes } from "@/config/routes";
import { DASHBOARD_MAX_RECENT_ACTIVITY } from "./schema";
import type { DashboardRecentActivityItem, DashboardStorageSnapshot } from "./types";

function toWebsiteActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  return snapshot.websites.slice(0, 8).flatMap((website) => [
    {
      id: `website_generated_${website.id}_${website.generatedAt}`,
      type: "website_update" as const,
      title: "Website generated",
      detail: website.title,
      timestamp: website.generatedAt,
      status: "success" as const,
      href: website.generatedSitePath,
    },
    {
      id: `website_${website.id}_${website.lastUpdatedAt}`,
      type: "website_update" as const,
      title: "Website updated",
      detail: `${website.title} · Status: ${website.status}`,
      timestamp: website.lastUpdatedAt,
      status: website.status === "failed" ? "error" as const : website.status === "live" ? "success" as const : "info" as const,
      href: website.generatedSitePath,
    },
  ]);
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

  return websitePublishes;
}

function toWebsiteShareActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  const websiteTitles = new Map(snapshot.websites.map((website) => [website.id, website.title]));
  return snapshot.websiteShares.map((share) => ({
    id: `website_shared_${share.id}`,
    type: "website_update" as const,
    title: "Website shared",
    detail: share.postTitle || websiteTitles.get(share.websiteId) || "Generated website",
    timestamp: share.sharedAt,
    status: "success" as const,
    href: routes.feed,
  }));
}

export function buildDashboardRecentActivity(snapshot: DashboardStorageSnapshot): DashboardRecentActivityItem[] {
  const items = [
    ...toWebsiteActivity(snapshot),
    ...toPublishActivity(snapshot),
    ...toWebsiteShareActivity(snapshot),
  ];

  return items
    .filter((entry) => Boolean(entry.timestamp))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, DASHBOARD_MAX_RECENT_ACTIVITY);
}
