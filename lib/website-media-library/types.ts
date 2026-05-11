import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";

export type WebsiteMediaLibraryStatus = "active" | "archived" | "deleted";

export type WebsiteMediaLibraryUsageKind =
  | "library"
  | "editor_insert"
  | "website_content"
  | "page_asset"
  | "section_asset"
  | "ai_asset_source";

export interface WebsiteMediaLibraryItem {
  id: string;
  userId: string;
  tenantId: string;
  websiteId?: string;
  mediaId: string;
  aiAssetId?: string;
  displayName: string;
  description?: string;
  altText?: string;
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  tags: string[];
  usageCount: number;
  usageSummary: Record<string, unknown>;
  associationSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  archivedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteMediaLibraryItemRow {
  id: string;
  user_id: string;
  tenant_id: string;
  website_id?: string | null;
  media_id: string;
  ai_asset_id?: string | null;
  display_name: string;
  description?: string | null;
  alt_text?: string | null;
  media_type: string;
  mime_type: string;
  file_size_bytes: number;
  width?: number | null;
  height?: number | null;
  tags: string[];
  usage_count: number;
  usage_summary_json: unknown;
  association_summary_json: unknown;
  metadata_json: unknown;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteMediaLibraryUsageRecord {
  id: string;
  libraryItemId: string;
  mediaId: string;
  userId: string;
  tenantId: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
  usageKind: WebsiteMediaLibraryUsageKind;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteMediaLibraryUsageRow {
  id: string;
  library_item_id: string;
  media_id: string;
  user_id: string;
  tenant_id: string;
  website_id: string;
  content_id: string;
  content_type: string;
  page_id: string;
  section_id: string;
  usage_kind: WebsiteMediaLibraryUsageKind;
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface WebsiteMediaLibraryListQuery {
  page: number;
  perPage: number;
  search?: string;
  mediaType?: string;
  websiteId?: string;
  tag?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  status?: WebsiteMediaLibraryStatus | "all";
  includeDeleted?: boolean;
}

export interface WebsiteMediaLibraryListResult {
  items: WebsiteMediaLibraryItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface WebsiteMediaLibraryApiRecord {
  id: string;
  websiteId?: string;
  mediaId: string;
  aiAssetId?: string;
  displayName: string;
  description?: string;
  altText?: string;
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  tags: string[];
  usageCount: number;
  status: WebsiteMediaLibraryStatus;
  createdAt: string;
  updatedAt: string;
  previewEndpoint: string;
  deleteEndpoint: string;
  tagsEndpoint: string;
  usageEndpoint: string;
  permissions?: StorageClientPermissionMatrix;
}

export interface WebsiteMediaLibrarySignedPreview {
  itemId: string;
  mediaId: string;
  url: string;
  expiresAt: string;
}

export interface WebsiteMediaLibraryUploadInput {
  userId: string;
  tenantId?: string;
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  pageId?: string;
  sectionId?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
  title?: string;
  description?: string;
  altText?: string;
  tags?: string[];
}

export interface WebsiteMediaLibraryUpsertInput {
  userId: string;
  tenantId: string;
  websiteId?: string;
  mediaId: string;
  aiAssetId?: string;
  displayName: string;
  description?: string;
  altText?: string;
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  tags?: string[];
  usageSummary?: Record<string, unknown>;
  associationSummary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WebsiteMediaLibraryTagUpdateInput {
  userId: string;
  itemId: string;
  websiteId?: string;
  displayName?: string;
  description?: string;
  altText?: string;
  tags?: string[];
}

export interface WebsiteMediaLibraryUsageInput {
  userId: string;
  itemId: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
  usageKind: WebsiteMediaLibraryUsageKind;
  metadata?: Record<string, unknown>;
}
