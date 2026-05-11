import { buildWebsiteAssetUrlPath } from "./urls";
import type { WebsiteAssetApiRecord, WebsiteAssetAssociation, WebsiteAssetDelivery, WebsiteAssetRecord, WebsiteAssetStatus } from "./types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function toWebsiteAssetAssociation(summary: unknown): WebsiteAssetAssociation {
  const record = toRecord(summary);
  return {
    websiteId: toOptionalString(record.websiteId),
    contentId: toOptionalString(record.linkedContentId),
    contentType: toOptionalString(record.linkedContentType),
    pageId: toOptionalString(record.pageId),
    sectionId: toOptionalString(record.sectionId),
  };
}

export function resolveWebsiteAssetStatus(record: WebsiteAssetRecord): WebsiteAssetStatus {
  if (!record.media) {
    return "missing";
  }
  if (record.libraryItem.deletedAt) {
    return "deleted";
  }
  if (record.libraryItem.archivedAt) {
    return "archived";
  }
  return "active";
}

function buildUrlEndpoint(record: WebsiteAssetRecord, delivery: WebsiteAssetDelivery): string {
  if (!delivery.renderUrl.includes("?")) {
    return buildWebsiteAssetUrlPath(record.id);
  }

  const url = new URL(delivery.renderUrl, "http://localhost");
  const endpoint = new URL(buildWebsiteAssetUrlPath(record.id), "http://localhost");
  endpoint.search = url.search;
  return `${endpoint.pathname}${endpoint.search}`;
}

export function createWebsiteAssetApiRecord(record: WebsiteAssetRecord, delivery: WebsiteAssetDelivery): WebsiteAssetApiRecord {
  return {
    assetId: record.id,
    libraryItemId: record.libraryItem.id,
    mediaId: record.libraryItem.mediaId,
    aiAssetId: record.libraryItem.aiAssetId,
    websiteId: record.association.websiteId ?? record.libraryItem.websiteId,
    contentId: record.association.contentId,
    contentType: record.association.contentType,
    pageId: record.association.pageId,
    sectionId: record.association.sectionId,
    displayName: record.libraryItem.displayName,
    description: record.libraryItem.description,
    altText: record.libraryItem.altText,
    mediaType: record.libraryItem.mediaType,
    mimeType: record.libraryItem.mimeType,
    fileSizeBytes: record.libraryItem.fileSizeBytes,
    width: record.libraryItem.width,
    height: record.libraryItem.height,
    status: resolveWebsiteAssetStatus(record),
    publicationState: record.publicationState,
    accessLevel: delivery.accessLevel,
    renderUrl: delivery.renderUrl,
    safeAccessUrl: delivery.safeAccessUrl,
    urlEndpoint: buildUrlEndpoint(record, delivery),
    fallbackUrl: delivery.fallbackUrl,
    expiresAt: delivery.expiresAt,
  };
}
