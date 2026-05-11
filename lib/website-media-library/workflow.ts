import "server-only";

import { config } from "@/config";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { deleteOwnedAiAsset } from "@/lib/ai-assets/workflow";
import { createOwnedMediaSignedUrl, deleteOwnedMedia, uploadOwnedMedia } from "@/lib/media/workflow";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import { resolveTenantId, toMediaApiRecord } from "@/lib/media/model";
import { buildWebsiteMediaAssociationSummary, buildWebsiteMediaUsageSummary, createWebsiteMediaUsageRecord, usageInputToMetadata } from "./usage";
import { getWebsiteMediaLibraryStatus, toWebsiteMediaLibraryApiRecord } from "./model";
import { createOrUpdateWebsiteMediaLibraryItem, getOwnedWebsiteMediaLibraryItem, listOwnedAiAssetLibraryCandidates, listOwnedWebsiteMediaLibraryItems, listWebsiteMediaLibraryUsage, restoreWebsiteMediaLibraryItem, saveWebsiteMediaLibraryUsage, softDeleteWebsiteMediaLibraryItem, updateWebsiteMediaLibraryItem } from "./storage";
import { validateWebsiteMediaLibraryUploadInput, validateWebsiteMediaTagUpdateInput, validateWebsiteMediaUsageInput } from "./validation";
import type { WebsiteMediaLibraryListQuery, WebsiteMediaLibrarySignedPreview, WebsiteMediaLibraryTagUpdateInput, WebsiteMediaLibraryUploadInput, WebsiteMediaLibraryUsageInput } from "./types";

async function assertOwnedWebsite(userId: string, websiteId: string | undefined): Promise<void> {
  if (!websiteId) return;
  const website = await getWebsiteStructure(websiteId, userId);
  if (!website || website.management?.deletedAt) {
    throw new Error("Website not found.");
  }
}

async function syncAiAssetsIntoLibrary(userId: string, tenantId: string): Promise<void> {
  const candidates = await listOwnedAiAssetLibraryCandidates(userId, tenantId);
  await Promise.all(
    candidates.map(async (candidate) => {
      const media = await getOwnedMediaAsset(userId, candidate.mediaId);
      if (!media) return;
      await createOrUpdateWebsiteMediaLibraryItem({
        userId,
        tenantId,
        websiteId: candidate.websiteId,
        mediaId: candidate.mediaId,
        aiAssetId: candidate.aiAssetId,
        displayName: candidate.displayName,
        description: candidate.description,
        altText: candidate.altText,
        mediaType: media.mediaType,
        mimeType: media.mimeType,
        fileSizeBytes: media.fileSizeBytes,
        width: media.width,
        height: media.height,
        tags: candidate.tags,
        metadata: {
          source: "ai-asset",
          ...candidate.metadata,
        },
      });
    }),
  );
}

async function refreshUsageSummary(itemId: string, userId: string) {
  const item = await getOwnedWebsiteMediaLibraryItem(userId, itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  const usage = await listWebsiteMediaLibraryUsage(item.id, userId);
  const updated = await updateWebsiteMediaLibraryItem({
    ...item,
    usageCount: usage.length,
    usageSummary: buildWebsiteMediaUsageSummary(usage),
  });
  return { item: updated, usage };
}

export async function uploadWebsiteMediaLibraryItem(input: WebsiteMediaLibraryUploadInput): Promise<{ item: ReturnType<typeof toWebsiteMediaLibraryApiRecord>; preview: WebsiteMediaLibrarySignedPreview; media: ReturnType<typeof toMediaApiRecord>; }> {
  const validation = validateWebsiteMediaLibraryUploadInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  await assertOwnedWebsite(input.userId, validation.normalized.websiteId);
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const uploaded = await uploadOwnedMedia({
    userId: input.userId,
    tenantId,
    fileName: validation.normalized.fileName,
    mimeType: validation.normalized.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    bytes: input.bytes,
    mediaType: validation.normalized.mediaType,
    linkedContentId: validation.normalized.linkedContentId,
    linkedContentType: validation.normalized.linkedContentType,
    usageContext: "library",
  });

  const media = await getOwnedMediaAsset(input.userId, uploaded.media.id);
  if (!media) {
    throw new Error("Uploaded media could not be loaded.");
  }

  const created = await createOrUpdateWebsiteMediaLibraryItem({
    userId: input.userId,
    tenantId,
    websiteId: validation.normalized.websiteId,
    mediaId: media.id,
    displayName: validation.normalized.title ?? media.originalFilename,
    description: validation.normalized.description,
    altText: validation.normalized.altText,
    mediaType: media.mediaType,
    mimeType: media.mimeType,
    fileSizeBytes: media.fileSizeBytes,
    width: media.width,
    height: media.height,
    tags: validation.normalized.tags,
    usageSummary: { total: 0 },
    associationSummary: buildWebsiteMediaAssociationSummary({
      websiteId: validation.normalized.websiteId,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      pageId: validation.normalized.pageId,
      sectionId: validation.normalized.sectionId,
    }),
    metadata: {
      source: "upload",
      signedUrlTtlSeconds: config.services.media.signedUrlTtlSeconds,
    },
  });

  await saveWebsiteMediaLibraryUsage(createWebsiteMediaUsageRecord({
    itemId: created.id,
    mediaId: created.mediaId,
    userId: created.userId,
    tenantId: created.tenantId,
    websiteId: validation.normalized.websiteId,
    contentId: validation.normalized.linkedContentId,
    contentType: validation.normalized.linkedContentType,
    pageId: validation.normalized.pageId,
    sectionId: validation.normalized.sectionId,
    usageKind: "library",
  }));

  const refreshed = await refreshUsageSummary(created.id, input.userId);
  const preview = await createWebsiteMediaLibraryPreview({ userId: input.userId, itemId: refreshed.item.id });

  return {
    item: toWebsiteMediaLibraryApiRecord(refreshed.item),
    preview,
    media: uploaded.media,
  };
}

export async function listWebsiteMediaLibrary(input: { userId: string; tenantId?: string; query: WebsiteMediaLibraryListQuery; }) {
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  await syncAiAssetsIntoLibrary(input.userId, tenantId);
  const page = await listOwnedWebsiteMediaLibraryItems(input.userId, tenantId, input.query);
  return {
    page,
    items: page.items.map(toWebsiteMediaLibraryApiRecord),
  };
}

export async function getWebsiteMediaLibraryItemDetail(input: { userId: string; itemId: string; }) {
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) return null;
  return toWebsiteMediaLibraryApiRecord(item);
}

export async function createWebsiteMediaLibraryPreview(input: { userId: string; itemId: string; expiresInSeconds?: number; }): Promise<WebsiteMediaLibrarySignedPreview> {
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  const signed = await createOwnedMediaSignedUrl({
    userId: input.userId,
    mediaId: item.mediaId,
    expiresInSeconds: input.expiresInSeconds ?? config.services.media.signedUrlTtlSeconds,
  });

  return {
    itemId: item.id,
    mediaId: item.mediaId,
    url: signed.url,
    expiresAt: signed.expiresAt,
  };
}

export async function updateWebsiteMediaLibraryTags(input: WebsiteMediaLibraryTagUpdateInput) {
  const validation = validateWebsiteMediaTagUpdateInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  await assertOwnedWebsite(input.userId, validation.normalized.websiteId);
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  const updated = await updateWebsiteMediaLibraryItem({
    ...item,
    websiteId: validation.normalized.websiteId ?? item.websiteId,
    displayName: validation.normalized.displayName ?? item.displayName,
    description: validation.normalized.description ?? item.description,
    altText: validation.normalized.altText ?? item.altText,
    tags: validation.normalized.tags ?? item.tags,
  });

  return toWebsiteMediaLibraryApiRecord(updated);
}

export async function trackWebsiteMediaUsage(input: WebsiteMediaLibraryUsageInput) {
  const validation = validateWebsiteMediaUsageInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  await assertOwnedWebsite(input.userId, validation.normalized.websiteId);
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  await saveWebsiteMediaLibraryUsage(createWebsiteMediaUsageRecord({
    itemId: item.id,
    mediaId: item.mediaId,
    userId: item.userId,
    tenantId: item.tenantId,
    websiteId: validation.normalized.websiteId,
    contentId: validation.normalized.contentId,
    contentType: validation.normalized.contentType,
    pageId: validation.normalized.pageId,
    sectionId: validation.normalized.sectionId,
    usageKind: input.usageKind,
    metadata: usageInputToMetadata(input),
  }));

  const refreshed = await refreshUsageSummary(item.id, input.userId);
  return {
    item: toWebsiteMediaLibraryApiRecord(refreshed.item),
    usage: refreshed.usage,
  };
}

export async function listWebsiteMediaUsage(input: { userId: string; itemId: string; }) {
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  const usage = await listWebsiteMediaLibraryUsage(item.id, input.userId);
  return {
    item: toWebsiteMediaLibraryApiRecord(item),
    usage,
    summary: buildWebsiteMediaUsageSummary(usage),
  };
}

export async function deleteWebsiteMediaLibraryItem(input: { userId: string; itemId: string; }): Promise<{ deleted: boolean; mode: "archived" | "deleted"; item?: ReturnType<typeof toWebsiteMediaLibraryApiRecord>; }> {
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    return { deleted: false, mode: "deleted" };
  }

  const usage = await listWebsiteMediaLibraryUsage(item.id, input.userId);
  const isInUse = usage.some((entry) => entry.usageKind !== "library");

  if (isInUse) {
    const archived = await softDeleteWebsiteMediaLibraryItem(item, "archive");
    return {
      deleted: true,
      mode: "archived",
      item: toWebsiteMediaLibraryApiRecord(archived),
    };
  }

  if (item.aiAssetId) {
    await deleteOwnedAiAsset({ userId: input.userId, assetId: item.aiAssetId });
  } else {
    await deleteOwnedMedia({ userId: input.userId, mediaId: item.mediaId });
  }

  const deleted = await softDeleteWebsiteMediaLibraryItem(item, "delete");
  return {
    deleted: true,
    mode: "deleted",
    item: toWebsiteMediaLibraryApiRecord(deleted),
  };
}

export async function restoreWebsiteMediaLibraryArchivedItem(input: { userId: string; itemId: string; }) {
  const item = await getOwnedWebsiteMediaLibraryItem(input.userId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }
  if (getWebsiteMediaLibraryStatus(item) === "active") {
    return toWebsiteMediaLibraryApiRecord(item);
  }
  const restored = await restoreWebsiteMediaLibraryItem(item);
  return toWebsiteMediaLibraryApiRecord(restored);
}
