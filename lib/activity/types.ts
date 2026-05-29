import type { WebsiteManagementRecord } from "@/lib/management";
import type { ContentSchedule } from "@/lib/scheduling";
import type { SocialAccountConnection } from "@/lib/social/accounts";
import type { SocialPublishHistoryJob } from "@/lib/social/history";
import type { SocialSchedule } from "@/lib/social/scheduling";
import type { GeneratedSocialPost } from "@/lib/social/types";

export type PublishingActivityStatus =
  | "published"
  | "scheduled"
  | "failed"
  | "publishing"
  | "retry_pending"
  | "canceled";

export type PublishingActivityPlatform = "website" | "instagram" | "facebook" | "linkedin" | "x";

export type PublishingActivityContentType = "website" | "website_page" | "blog" | "article" | "social_post";

export type PublishingActivityEventType =
  | "website_published"
  | "website_publish_failed"
  | "content_published"
  | "content_scheduled"
  | "content_schedule_failed"
  | "social_scheduled"
  | "social_publishing"
  | "social_published"
  | "social_failed"
  | "social_retry_pending"
  | "social_canceled";

export type PublishingActivitySegment = "all" | "recent" | "upcoming" | "attention";

export interface PublishingActivityQuickAction {
  id: string;
  label: string;
  kind: "link" | "api";
  href?: string;
  apiPath?: string;
  method?: "POST";
}

export interface PublishingActivityItem {
  id: string;
  source: "website" | "generated_content" | "content_schedule" | "social_schedule" | "social_history";
  title: string;
  contentType: PublishingActivityContentType;
  platform: PublishingActivityPlatform;
  account?: string;
  status: PublishingActivityStatus;
  eventType: PublishingActivityEventType;
  occurredAt: string;
  scheduledFor?: string;
  createdAt?: string;
  updatedAt?: string;
  structureId?: string;
  socialPostId?: string;
  scheduleId?: string;
  quickActions: PublishingActivityQuickAction[];
}

export interface PublishingActivityTimelineGroup {
  date: string;
  label: string;
  items: PublishingActivityItem[];
}

export interface PublishingActivityQuery {
  platform: PublishingActivityPlatform | "all";
  status: PublishingActivityStatus | "all";
  contentType: PublishingActivityContentType | "all";
  segment: PublishingActivitySegment;
  from?: string;
  to?: string;
  limit: number;
}

export interface PublishingActivityOverview {
  generatedAt: string;
  query: PublishingActivityQuery;
  items: PublishingActivityItem[];
  recent: PublishingActivityItem[];
  upcoming: PublishingActivityItem[];
  attention: PublishingActivityItem[];
  timeline: PublishingActivityTimelineGroup[];
  scenarios: string[];
  mvpBoundaries: string[];
}

export interface PublishingActivityGeneratedContentRow {
  id: string;
  structure_id: string;
  content_type: "website" | "blog" | "article";
  content_status: string;
  schedule_state: string;
  page_slug: string;
  created_at: string;
  updated_at: string;
}

export interface PublishingActivityStorageSnapshot {
  websites: WebsiteManagementRecord[];
  contentSchedules: ContentSchedule[];
  socialSchedules: SocialSchedule[];
  socialHistory: SocialPublishHistoryJob[];
  socialAccounts: SocialAccountConnection[];
  socialPosts: GeneratedSocialPost[];
  generatedContentRows: PublishingActivityGeneratedContentRow[];
}
