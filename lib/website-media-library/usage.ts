import { createWebsiteMediaUsageId } from "./model";
import type { WebsiteMediaLibraryUsageInput, WebsiteMediaLibraryUsageKind, WebsiteMediaLibraryUsageRecord } from "./types";

export function buildWebsiteMediaAssociationSummary(input: {
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  pageId?: string;
  sectionId?: string;
}): Record<string, unknown> {
  return {
    websiteId: input.websiteId,
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
    pageId: input.pageId,
    sectionId: input.sectionId,
  };
}

export function buildWebsiteMediaUsageSummary(usage: WebsiteMediaLibraryUsageRecord[]): Record<string, unknown> {
  const usageKinds = usage.reduce<Record<string, number>>((summary, entry) => {
    summary[entry.usageKind] = (summary[entry.usageKind] ?? 0) + 1;
    return summary;
  }, {});

  return {
    total: usage.length,
    usageKinds,
    websites: Array.from(new Set(usage.map((entry) => entry.websiteId).filter(Boolean))),
    pages: Array.from(new Set(usage.map((entry) => entry.pageId).filter(Boolean))),
    sections: Array.from(new Set(usage.map((entry) => entry.sectionId).filter(Boolean))),
  };
}

export function createWebsiteMediaUsageRecord(input: {
  itemId: string;
  mediaId: string;
  userId: string;
  tenantId: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
  usageKind: WebsiteMediaLibraryUsageKind;
  metadata?: Record<string, unknown>;
}): WebsiteMediaLibraryUsageRecord {
  const now = new Date().toISOString();
  return {
    id: createWebsiteMediaUsageId(input.itemId),
    libraryItemId: input.itemId,
    mediaId: input.mediaId,
    userId: input.userId,
    tenantId: input.tenantId,
    websiteId: input.websiteId,
    contentId: input.contentId,
    contentType: input.contentType,
    pageId: input.pageId,
    sectionId: input.sectionId,
    usageKind: input.usageKind,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

export function usageInputToMetadata(input: WebsiteMediaLibraryUsageInput): Record<string, unknown> {
  return {
    contentId: input.contentId,
    contentType: input.contentType,
    pageId: input.pageId,
    sectionId: input.sectionId,
    ...(input.metadata ?? {}),
  };
}
