import type { WebsiteLifecycleStatus, WebsiteManagementRecord } from "@/lib/management";

export type DashboardAlertSeverity = "info" | "warning" | "error";

export type DashboardActivityType =
  | "website_update"
  | "publish_event";

export interface DashboardMetricSummary {
  totalWebsites: number;
  draftWebsites: number;
  publishedWebsites: number;
  totalViews: number | null;
  totalHearts: number | null;
  storedPages: number | null;
  storedVersions: number | null;
  publishedItems: number;
  generatedContentCount: number;
  scheduledItems: number;
  attentionRequiredItems: number;
}

export interface DashboardRecentActivityItem {
  id: string;
  type: DashboardActivityType;
  title: string;
  detail: string;
  timestamp: string;
  status?: "success" | "warning" | "error" | "info";
  href?: string;
}

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  detail: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  eventName: string;
}

export interface DashboardWebsiteSummary {
  total: number;
  published: number;
  draft: number;
  archived: number;
  attentionRequired: number;
  storedPages: number | null;
  storedVersions: number | null;
  dataSource: "website_projects" | "website_structures" | "hybrid";
  generatedWebsites: Array<{
    id: string;
    title: string;
    status: WebsiteLifecycleStatus;
    statusLabel: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    liveUrl?: string;
    generatedSitePath?: string;
    previewPath?: string;
    editorPath?: string;
    visibility?: "public" | "private";
    pageCount?: number;
    pageCountSource: "website_pages" | "website_structures" | "website_projects" | "unavailable";
    designConfigured: boolean;
    thumbnailAccentColor?: string;
    thumbnailSurfaceColor?: string;
  }>;
}

export interface DashboardContentSummary {
  totalGenerated: number;
  websiteGenerated: number;
  blogGenerated: number;
  articleGenerated: number;
  publishedContent: number;
  scheduledContent: number;
  pendingApproval: number;
}

export interface DashboardSocialSummary {
  connectedAccounts: number;
  accountsNeedingAttention: number;
  generatedPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  failedPublishes: number;
}

export interface DashboardSummary {
  generatedAt: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
  metrics: DashboardMetricSummary;
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardRecentActivityItem[];
  websiteSummary: DashboardWebsiteSummary;
  contentSummary: DashboardContentSummary;
  socialSummary: DashboardSocialSummary;
  alerts: DashboardAlert[];
  mvpBoundaries: string[];
}

export interface DashboardStorageSnapshot {
  websites: WebsiteManagementRecord[];
  websiteShares: DashboardWebsiteShareActivity[];
}

export interface DashboardWebsiteShareActivity {
  id: string;
  websiteId: string;
  postTitle: string | null;
  sharedAt: string;
}
