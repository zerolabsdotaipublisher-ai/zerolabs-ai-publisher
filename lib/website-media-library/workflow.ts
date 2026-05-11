import "server-only";

import { config } from "@/config";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { deleteOwnedAiAsset } from "@/lib/ai-assets/workflow";
import { buildFileUploadAssociations } from "@/lib/file-upload/associations";
import { deleteOwnedFileUpload, uploadOwnedFile } from "@/lib/file-upload/workflow";
import type { FileUploadResult } from "@/lib/file-upload/types";
import { createMediaSignedUrlFromOwnerResource, deleteOwnedMedia } from "@/lib/media/workflow";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import { resolveTenantId, toMediaApiRecord } from "@/lib/media/model";
import {
  assertStorageResourcePermission,
  assertStorageUploadPermission,
  buildStoragePermissionMatrix,
  createResourceUserStorageActor,
  createScopedUserStorageActor,
  type StorageAccessActorContext,
  type StorageAccessResourceRecord,
} from "@/lib/storage-access";
import { buildWebsiteMediaAssociationSummary, buildWebsiteMediaUsageSummary, createWebsiteMediaUsageRecord, usageInputToMetadata } from "./usage";
import { getWebsiteMediaLibraryStatus, toWebsiteMediaLibraryApiRecord } from "./model";
import {
  createOrUpdateWebsiteMediaLibraryItem,
  getOwnedWebsiteMediaLibraryItem,
  listOwnedAiAssetLibraryCandidates,
  listOwnedWebsiteMediaLibraryItems,
  listWebsiteMediaLibraryUsage,
  restoreWebsiteMediaLibraryItem,
  saveWebsiteMediaLibraryUsage,
  softDeleteWebsiteMediaLibraryItem,
  updateWebsiteMediaLibraryItem,
} from "./storage";
import { validateWebsiteMediaLibraryUploadInput, validateWebsiteMediaTagUpdateInput, validateWebsiteMediaUsageInput } from "./validation";
import type { WebsiteMediaLibraryItem, WebsiteMediaLibraryListQuery, WebsiteMediaLibrarySignedPreview, WebsiteMediaLibraryTagUpdateInput, WebsiteMediaLibraryUploadInput, WebsiteMediaLibraryUsageInput } from "./types";

function toWebsiteMediaResource(item: WebsiteMediaLibraryItem): StorageAccessResourceRecord {
  return {
    resourceType: "website_media",
    resourceId: item.id,
    ownerUserId: item.userId,
    tenantId: item.tenantId,
    mediaId: item.mediaId,
    websiteId: item.websiteId,
    status: getWebsiteMediaLibraryStatus(item),
    visibility: "private",
    deletedAt: item.deletedAt,
    metadata: {
      ...item.metadata,
      usageSummary: item.usageSummary,
      associationSummary: item.associationSummary,
    },
    environmentStage: typeof item.metadata.environmentStage === "string" ? item.metadata.environmentStage : undefined,
  };
}

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
          environmentStage: createScopedUserStorageActor(userId, tenantId).environmentStage,
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

export async function uploadWebsiteMediaLibraryItem(input: WebsiteMediaLibraryUploadInput): Promise<{
  upload: FileUploadResult["upload"];
  item: ReturnType<typeof toWebsiteMediaLibraryApiRecord>;
  preview: WebsiteMediaLibrarySignedPreview;
  media: ReturnType<typeof toMediaApiRecord>;
}> {
  const validation = validateWebsiteMediaLibraryUploadInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  await assertOwnedWebsite(input.userId, validation.normalized.websiteId);
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const actor = createScopedUserStorageActor(input.userId, tenantId);
  await assertStorageUploadPermission(actor, {
    resourceType: "website_media",
    tenantId,
    websiteId: validation.normalized.websiteId,
    linkedContentId: validation.normalized.linkedContentId,
    linkedContentType: validation.normalized.linkedContentType,
  });

  const uploaded = await uploadOwnedFile({
    userId: input.userId,
    tenantId,
    source: "website_editing",
    fileName: validation.normalized.fileName,
    mimeType: validation.normalized.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    bytes: input.bytes,
    mediaType: validation.normalized.mediaType,
    linkedContentId: validation.normalized.linkedContentId,
    linkedContentType: validation.normalized.linkedContentType,
    usageContext: "library",
    associations: buildFileUploadAssociations({
      source: "website_editing",
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      websiteId: validation.normalized.websiteId,
      pageId: validation.normalized.pageId,
      sectionId: validation.normalized.sectionId,
      metadata: { surface: "website-media-library" },
    }),
    metadata: {
      surface: "website-media-library",
      websiteId: validation.normalized.websiteId,
      pageId: validation.normalized.pageId,
      sectionId: validation.normalized.sectionId,
      environmentStage: actor.environmentStage,
    },
  });

  if (!uploaded.media) {
    throw new Error("Uploaded media could not be loaded.");
  }

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
      uploadId: uploaded.upload.id,
      environmentStage: actor.environmentStage,
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
  const preview = await createWebsiteMediaLibraryPreview({ itemId: refreshed.item.id, actor });

  return {
    upload: uploaded.upload,
    item: toWebsiteMediaLibraryApiRecord(refreshed.item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(refreshed.item))),
    preview,
    media: toMediaApiRecord(media),
  };
}

export async function listWebsiteMediaLibrary(input: { userId: string; tenantId?: string; query: WebsiteMediaLibraryListQuery; }) {
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const actor = createScopedUserStorageActor(input.userId, tenantId);
  await syncAiAssetsIntoLibrary(input.userId, tenantId);
  const page = await listOwnedWebsiteMediaLibraryItems(input.userId, tenantId, input.query);
  return {
    page,
    items: page.items.map((item) => toWebsiteMediaLibraryApiRecord(item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(item)))),
  };
}

export async function getWebsiteMediaLibraryItemDetail(input: { userId: string; itemId: string; }) {
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "read",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
  if (!item) return null;
  return toWebsiteMediaLibraryApiRecord(item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(item)));
}

export async function createWebsiteMediaLibraryPreview(input: { actor: StorageAccessActorContext; itemId: string; expiresInSeconds?: number; }): Promise<WebsiteMediaLibrarySignedPreview> {
  const resource = await assertStorageResourcePermission({
    actor: input.actor,
    operation: "preview",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }
  const media = await getOwnedMediaAsset(resource.ownerUserId, item.mediaId, true);
  if (!media) {
    throw new Error("Website media library media was not found.");
  }

  const signed = await createMediaSignedUrlFromOwnerResource({
    actor: input.actor,
    media,
    expiresInSeconds: input.expiresInSeconds ?? config.services.media.signedUrlTtlSeconds,
    cacheKeyPrefix: `${input.actor.actorType}:${item.id}`,
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
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "update",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
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

  return toWebsiteMediaLibraryApiRecord(updated, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(updated)));
}

export async function trackWebsiteMediaUsage(input: WebsiteMediaLibraryUsageInput) {
  const validation = validateWebsiteMediaUsageInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  await assertOwnedWebsite(input.userId, validation.normalized.websiteId);
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "update",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
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
    item: toWebsiteMediaLibraryApiRecord(refreshed.item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(refreshed.item))),
    usage: refreshed.usage,
  };
}

export async function listWebsiteMediaUsage(input: { userId: string; itemId: string; }) {
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "read",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }

  const usage = await listWebsiteMediaLibraryUsage(item.id, resource.ownerUserId);
  return {
    item: toWebsiteMediaLibraryApiRecord(item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(item))),
    usage,
    summary: buildWebsiteMediaUsageSummary(usage),
  };
}

export async function deleteWebsiteMediaLibraryItem(input: { userId: string; itemId: string; }): Promise<{ deleted: boolean; mode: "archived" | "deleted"; item?: ReturnType<typeof toWebsiteMediaLibraryApiRecord>; }> {
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "delete",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
  if (!item) {
    return { deleted: false, mode: "deleted" };
  }

  const usage = await listWebsiteMediaLibraryUsage(item.id, resource.ownerUserId);
  const isInUse = usage.some((entry) => entry.usageKind !== "library");

  if (isInUse) {
    const archived = await softDeleteWebsiteMediaLibraryItem(item, "archive");
    return {
      deleted: true,
      mode: "archived",
      item: toWebsiteMediaLibraryApiRecord(archived, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(archived))),
    };
  }

  if (item.aiAssetId) {
    await deleteOwnedAiAsset({ userId: resource.ownerUserId, assetId: item.aiAssetId });
  } else {
    const uploadId = typeof item.metadata.uploadId === "string" ? item.metadata.uploadId : undefined;
    if (uploadId) {
      await deleteOwnedFileUpload({ userId: resource.ownerUserId, uploadId });
    } else {
      await deleteOwnedMedia({ userId: resource.ownerUserId, mediaId: item.mediaId });
    }
  }

  const deleted = await softDeleteWebsiteMediaLibraryItem(item, "delete");
  return {
    deleted: true,
    mode: "deleted",
    item: toWebsiteMediaLibraryApiRecord(deleted, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(deleted))),
  };
}

export async function restoreWebsiteMediaLibraryArchivedItem(input: { userId: string; itemId: string; }) {
  const actor = createResourceUserStorageActor(input.userId);
  const resource = await assertStorageResourcePermission({
    actor,
    operation: "update",
    resourceType: "website_media",
    resourceId: input.itemId,
  });
  const item = await getOwnedWebsiteMediaLibraryItem(resource.ownerUserId, input.itemId, true);
  if (!item) {
    throw new Error("Website media library item not found.");
  }
  if (getWebsiteMediaLibraryStatus(item) === "active") {
    return toWebsiteMediaLibraryApiRecord(item, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(item)));
  }
  const restored = await restoreWebsiteMediaLibraryItem(item);
  return toWebsiteMediaLibraryApiRecord(restored, buildStoragePermissionMatrix(actor, toWebsiteMediaResource(restored)));
}
