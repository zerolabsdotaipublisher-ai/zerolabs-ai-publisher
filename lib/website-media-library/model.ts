import type { WebsiteMediaLibraryApiRecord, WebsiteMediaLibraryItem, WebsiteMediaLibraryItemRow, WebsiteMediaLibraryStatus, WebsiteMediaLibraryUsageRecord, WebsiteMediaLibraryUsageRow } from "./types";
import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";
import { normalizeWebsiteMediaTags } from "./tags";

const EMPTY_REFERENCE_SENTINEL = "__none__";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function fromReferenceValue(value: string): string | undefined {
  return value && value !== EMPTY_REFERENCE_SENTINEL ? value : undefined;
}

function toReferenceValue(value: string | undefined): string {
  return value && value.trim() ? value : EMPTY_REFERENCE_SENTINEL;
}

function randomSuffix(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) {
    throw new Error("Secure random generation is unavailable in this runtime.");
  }

  if (typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID().replaceAll("-", "");
  }

  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createWebsiteMediaLibraryItemId(): string {
  return `wml_${Date.now().toString(36)}_${randomSuffix().slice(0, 12)}`;
}

export function createWebsiteMediaUsageId(libraryItemId: string): string {
  return `wmu_${libraryItemId.slice(0, 10)}_${randomSuffix().slice(0, 8)}`;
}

export function clampWebsiteMediaPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, value);
}

export function clampWebsiteMediaPerPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 18;
  return Math.min(100, Math.max(1, value));
}

export function getWebsiteMediaLibraryStatus(item: Pick<WebsiteMediaLibraryItem, "deletedAt" | "archivedAt">): WebsiteMediaLibraryStatus {
  if (item.deletedAt) return "deleted";
  if (item.archivedAt) return "archived";
  return "active";
}

export function fromWebsiteMediaLibraryItemRow(row: WebsiteMediaLibraryItemRow): WebsiteMediaLibraryItem {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    websiteId: row.website_id ?? undefined,
    mediaId: row.media_id,
    aiAssetId: row.ai_asset_id ?? undefined,
    displayName: row.display_name,
    description: row.description ?? undefined,
    altText: row.alt_text ?? undefined,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    tags: normalizeWebsiteMediaTags(row.tags),
    usageCount: row.usage_count,
    usageSummary: toRecord(row.usage_summary_json),
    associationSummary: toRecord(row.association_summary_json),
    metadata: toRecord(row.metadata_json),
    archivedAt: row.archived_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWebsiteMediaLibraryItemRow(item: WebsiteMediaLibraryItem): WebsiteMediaLibraryItemRow {
  return {
    id: item.id,
    user_id: item.userId,
    tenant_id: item.tenantId,
    website_id: item.websiteId ?? null,
    media_id: item.mediaId,
    ai_asset_id: item.aiAssetId ?? null,
    display_name: item.displayName,
    description: item.description ?? null,
    alt_text: item.altText ?? null,
    media_type: item.mediaType,
    mime_type: item.mimeType,
    file_size_bytes: item.fileSizeBytes,
    width: item.width ?? null,
    height: item.height ?? null,
    tags: normalizeWebsiteMediaTags(item.tags),
    usage_count: item.usageCount,
    usage_summary_json: item.usageSummary,
    association_summary_json: item.associationSummary,
    metadata_json: item.metadata,
    archived_at: item.archivedAt ?? null,
    deleted_at: item.deletedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function fromWebsiteMediaLibraryUsageRow(row: WebsiteMediaLibraryUsageRow): WebsiteMediaLibraryUsageRecord {
  return {
    id: row.id,
    libraryItemId: row.library_item_id,
    mediaId: row.media_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    websiteId: fromReferenceValue(row.website_id),
    contentId: fromReferenceValue(row.content_id),
    contentType: fromReferenceValue(row.content_type),
    pageId: fromReferenceValue(row.page_id),
    sectionId: fromReferenceValue(row.section_id),
    usageKind: row.usage_kind,
    metadata: toRecord(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWebsiteMediaLibraryUsageRow(record: WebsiteMediaLibraryUsageRecord): WebsiteMediaLibraryUsageRow {
  return {
    id: record.id,
    library_item_id: record.libraryItemId,
    media_id: record.mediaId,
    user_id: record.userId,
    tenant_id: record.tenantId,
    website_id: toReferenceValue(record.websiteId),
    content_id: toReferenceValue(record.contentId),
    content_type: toReferenceValue(record.contentType),
    page_id: toReferenceValue(record.pageId),
    section_id: toReferenceValue(record.sectionId),
    usage_kind: record.usageKind,
    metadata_json: record.metadata,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function toWebsiteMediaLibraryApiRecord(item: WebsiteMediaLibraryItem, permissions?: StorageClientPermissionMatrix): WebsiteMediaLibraryApiRecord {
  const encoded = encodeURIComponent(item.id);
  return {
    id: item.id,
    websiteId: item.websiteId,
    mediaId: item.mediaId,
    aiAssetId: item.aiAssetId,
    displayName: item.displayName,
    description: item.description,
    altText: item.altText,
    mediaType: item.mediaType,
    mimeType: item.mimeType,
    fileSizeBytes: item.fileSizeBytes,
    width: item.width,
    height: item.height,
    tags: item.tags,
    usageCount: item.usageCount,
    status: getWebsiteMediaLibraryStatus(item),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    assetId: item.id,
    assetRenderEndpoint: `/api/website-assets/${encoded}`,
    assetUrlEndpoint: `/api/website-assets/${encoded}/url`,
    previewEndpoint: `/api/website-media-library/${encoded}/preview`,
    deleteEndpoint: `/api/website-media-library/${encoded}/delete`,
    tagsEndpoint: `/api/website-media-library/${encoded}/tags`,
    usageEndpoint: `/api/website-media-library/${encoded}/usage`,
    permissions,
  };
}
