import type { ScheduleStatus } from "@/lib/scheduling";

export type ContentLibraryType = "website_page" | "blog_post" | "article" | "social_post";

export type ContentLibraryStatus =
  | "draft"
  | "generated"
  | "edited"
  | "scheduled"
  | "published"
  | "archived"
  | "deleted"
  | "failed"
  | "unknown";

export type ContentLibrarySort = "updated_desc" | "created_desc" | "title_asc";

export interface ContentLibraryLinkedWebsite {
  structureId: string;
  title: string;
}

export interface ContentLibraryQuickActions {
  viewHref?: string;
  editHref?: string;
  publishScheduleHref?: string;
  canDelete: boolean;
  deleteStructureId?: string;
}

export interface ContentLibraryItem {
  id: string;
  sourceId: string;
  type: ContentLibraryType;
  title: string;
  status: ContentLibraryStatus;
  createdAt: string;
  updatedAt: string;
  pageSlug?: string;
  linkedWebsite?: ContentLibraryLinkedWebsite;
  linkedCampaign?: string;
  keywords: string[];
  hasLinkedSeoMetadata: boolean;
  quickActions: ContentLibraryQuickActions;
}

export interface ContentLibraryWebsiteFilterOption {
  structureId: string;
  title: string;
}

export interface ContentLibraryPage {
  items: ContentLibraryItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  availableWebsites: ContentLibraryWebsiteFilterOption[];
  scenarios: string[];
  mvpBoundaries: string[];
}

export interface ContentLibraryQuery {
  page: number;
  perPage: number;
  search?: string;
  type: ContentLibraryType | "all";
  status: ContentLibraryStatus | "all";
  websiteId: string | "all";
  sort: ContentLibrarySort;
}

export interface ContentLibraryRawWebsitePageRow {
  id: string;
  structure_id: string;
  content_status: string;
  page_slug: string;
  content_json: unknown;
  generated_from_input: unknown;
  created_at: string;
  updated_at: string;
}

export interface ContentLibraryRawBlogRow {
  id: string;
  structure_id: string;
  content_status?: string | null;
  title: string;
  slug: string;
  source_input: unknown;
  generated_at: string;
  updated_at: string;
}

export interface ContentLibraryRawArticleRow {
  id: string;
  structure_id: string;
  content_status?: string | null;
  title: string;
  slug: string;
  source_input: unknown;
  generated_at: string;
  updated_at: string;
}

export interface ContentLibraryRawSocialRow {
  id: string;
  structure_id?: string | null;
  content_status?: string | null;
  title: string;
  topic: string;
  source_input: unknown;
  generated_at: string;
  updated_at: string;
}

export interface ContentLibraryRawSeoRow {
  structure_id: string;
  version: number;
  metadata_json: unknown;
}

export interface ContentLibraryStorageSnapshot {
  websitePages: ContentLibraryRawWebsitePageRow[];
  blogs: ContentLibraryRawBlogRow[];
  articles: ContentLibraryRawArticleRow[];
  socialPosts: ContentLibraryRawSocialRow[];
  seoSiteMetadataByStructureId: Map<string, string[]>;
  // Content schedules are reused to surface status indicators (e.g. active/running -> scheduled, failed -> failed).
  schedulesByStructureId: Map<string, { status: ScheduleStatus }>;
  websitesByStructureId: Map<string, { title: string }>;
}
