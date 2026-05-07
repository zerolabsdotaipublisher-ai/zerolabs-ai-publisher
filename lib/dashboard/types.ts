import type { WebsiteLifecycleStatus, WebsiteManagementRecord } from "@/lib/management";
import type { PublishingStatusModel } from "@/lib/publish/status";
import type { SocialAccountConnection } from "@/lib/social/accounts";
import type { SocialPublishHistoryJob } from "@/lib/social/history";
import type { SocialSchedule } from "@/lib/social/scheduling";
import type { GeneratedSocialPost } from "@/lib/social/types";

export type DashboardAlertSeverity = "info" | "warning" | "error";

export type DashboardActivityType =
  | "content_generation"
  | "website_update"
  | "publish_event"
  | "social_schedule"
  | "social_publish"
  | "account_event";

export interface DashboardMetricSummary {
  totalWebsites: number;
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
  recentlyUpdated: Array<{
    id: string;
    title: string;
    status: WebsiteLifecycleStatus;
    publishStatus: PublishingStatusModel;
    updatedAt: string;
    publishedAt?: string;
    href: string;
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

export interface DashboardGeneratedContentRow {
  id: string;
  structure_id: string;
  content_type: "website" | "blog" | "article";
  content_status: string;
  schedule_state: string;
  page_slug: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardGeneratedContentStats {
  total: number;
  website: number;
  blog: number;
  article: number;
  published: number;
  scheduled: number;
  rows: DashboardGeneratedContentRow[];
}

export interface DashboardStorageSnapshot {
  websites: WebsiteManagementRecord[];
  socialSchedules: SocialSchedule[];
  socialPosts: GeneratedSocialPost[];
  socialHistory: SocialPublishHistoryJob[];
  socialAccounts: SocialAccountConnection[];
  generatedContent: DashboardGeneratedContentStats;
}
