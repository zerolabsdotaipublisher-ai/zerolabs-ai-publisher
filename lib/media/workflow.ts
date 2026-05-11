import "server-only";

import { config } from "@/config";
import {
  assertStorageResourcePermission,
  assertStorageUploadPermission,
  buildStoragePermissionMatrix,
  createResourceUserStorageActor,
  createScopedUserStorageActor,
  resolveSignedUrlTtl,
  type StorageAccessActorContext,
  type StorageAccessResourceRecord,
} from "@/lib/storage-access";
import { getMediaStorageProvider } from "./provider";
import { buildMediaNamespacePrefix, buildMediaObjectKey, createMediaId, resolveMediaProvider, resolveTenantId, toMediaApiRecord } from "./model";
import { checkMediaQuotaAllowance } from "./quotas";
import {
  createMediaAsset,
  createNewMediaAsset,
  createUsageLink,
  getOwnedMediaAsset,
  listOwnedMediaAssets,
  saveMediaUsageLink,
  softDeleteMediaAsset,
  updateMediaQuotaDelta,
} from "./storage";
import { validateMediaUploadInput } from "./validation";
import { logMediaEvent, logMediaFailure, recordMediaDuration, recordMediaQuota } from "./monitoring";
import type { MediaAsset, MediaListQuery, MediaSignedAccess, MediaUploadInput } from "./types";

const signedUrlCache = new Map<string, { url: string; expiresAtMs: number }>();
const SIGNED_URL_CACHE_BUFFER_MS = 15_000;
const MAX_SIGNED_URL_CACHE_ENTRIES = 500;

function pruneSignedUrlCache(nowMs: number): void {
  for (const [key, value] of signedUrlCache.entries()) {
    if (value.expiresAtMs <= nowMs + SIGNED_URL_CACHE_BUFFER_MS) {
      signedUrlCache.delete(key);
    }
  }

  while (signedUrlCache.size > MAX_SIGNED_URL_CACHE_ENTRIES) {
    const oldestKey = signedUrlCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    signedUrlCache.delete(oldestKey);
  }
}

function resolveBucket(): string {
  const bucket = config.services.wasabi.bucket;
  if (!bucket) {
    throw new Error("WASABI_BUCKET is required for media storage.");
  }
  return bucket;
}

function toMediaResource(media: MediaAsset): StorageAccessResourceRecord {
  return {
    resourceType: "media",
    resourceId: media.id,
    ownerUserId: media.userId,
    tenantId: media.tenantId,
    mediaId: media.id,
    linkedContentId: media.linkedContentId,
    linkedContentType: media.linkedContentType,
    status: media.status,
    visibility: "private",
    deletedAt: media.deletedAt,
    metadata: media.metadata,
    objectKey: media.objectKey,
    namespacePrefix: buildMediaNamespacePrefix(media.tenantId),
    environmentStage: typeof media.metadata.environmentStage === "string" ? media.metadata.environmentStage : undefined,
  };
}

async function createMediaSignedUrlFromRecord(input: {
  actor: StorageAccessActorContext;
  media: MediaAsset;
  expiresInSeconds?: number;
  cacheKeyPrefix: string;
}): Promise<MediaSignedAccess> {
  const provider = getMediaStorageProvider();
  const resource = toMediaResource(input.media);
  const resolvedExpiresInSeconds = resolveSignedUrlTtl({
    actor: input.actor,
    resource,
    requestedExpiresInSeconds: input.expiresInSeconds,
  });
  const nowMs = Date.now();
  pruneSignedUrlCache(nowMs);
  const cacheKey = `${input.cacheKeyPrefix}:${input.media.id}:${resolvedExpiresInSeconds}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAtMs > nowMs + SIGNED_URL_CACHE_BUFFER_MS) {
    return {
      mediaId: input.media.id,
      url: cached.url,
      expiresAt: new Date(cached.expiresAtMs).toISOString(),
    };
  }

  const url = await provider.createSignedReadUrl({
    bucket: input.media.bucket,
    objectKey: input.media.objectKey,
    expiresInSeconds: resolvedExpiresInSeconds,
  });

  const expiresAtMs = nowMs + resolvedExpiresInSeconds * 1000;
  signedUrlCache.set(cacheKey, { url, expiresAtMs });
  return {
    mediaId: input.media.id,
    url,
    expiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export async function uploadOwnedMedia(input: MediaUploadInput): Promise<{
  media: ReturnType<typeof toMediaApiRecord>;
  signed: MediaSignedAccess;
}> {
  const startedAt = Date.now();
  const provider = getMediaStorageProvider();
  const bucket = resolveBucket();
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const actor = createScopedUserStorageActor(input.userId, tenantId);

  try {
    await assertStorageUploadPermission(actor, {
      resourceType: "media",
      tenantId,
      linkedContentId: input.linkedContentId,
      linkedContentType: input.linkedContentType,
    });

    const validation = validateMediaUploadInput(input);
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }

    const quota = await checkMediaQuotaAllowance({
      userId: input.userId,
      tenantId,
      incomingBytes: input.fileSizeBytes,
    });

    if (!quota.allowed) {
      throw new Error(quota.reason || "Media quota exceeded.");
    }

    const mediaId = createMediaId();
    const objectKey = buildMediaObjectKey(tenantId, mediaId, validation.normalized.fileName);

    await provider.uploadObject({
      bucket,
      objectKey,
      contentType: validation.normalized.mimeType,
      bytes: input.bytes,
      metadata: {
        mediaId,
        tenantId,
        userId: input.userId,
        ...(actor.environmentStage ? { environmentStage: actor.environmentStage } : {}),
      },
    });

    const created = await createMediaAsset(
      createNewMediaAsset({
        userId: input.userId,
        tenantId,
        provider: resolveMediaProvider(),
        bucket,
        objectKey,
        mediaType: validation.normalized.mediaType,
        mimeType: validation.normalized.mimeType,
        originalFilename: validation.normalized.fileName,
        fileSizeBytes: input.fileSizeBytes,
        width: input.width,
        height: input.height,
        linkedContentId: input.linkedContentId,
        linkedContentType: input.linkedContentType,
        metadata: {
          ...input.metadata,
          environmentStage: actor.environmentStage,
        },
        id: mediaId,
      }),
    );

    await saveMediaUsageLink(
      createUsageLink({
        mediaId: created.id,
        userId: input.userId,
        tenantId,
        contentId: input.linkedContentId,
        contentType: input.linkedContentType,
        usageContext: input.usageContext ?? "library",
      }),
    );

    const updatedQuota = await updateMediaQuotaDelta({
      userId: input.userId,
      tenantId,
      bytesDelta: created.fileSizeBytes,
      filesDelta: 1,
      reason: "upload",
    });

    recordMediaQuota(updatedQuota.totalBytes, updatedQuota.totalFiles, created.mediaType);

    const signed = await createOwnedMediaSignedUrl({
      userId: input.userId,
      mediaId: created.id,
      expiresInSeconds: config.services.media.signedUrlTtlSeconds,
    });

    const permissions = buildStoragePermissionMatrix(actor, toMediaResource(created));

    logMediaEvent("upload", {
      userId: input.userId,
      tenantId,
      mediaId: created.id,
      mediaType: created.mediaType,
      fileSizeBytes: created.fileSizeBytes,
    });

    return {
      media: toMediaApiRecord(created, permissions),
      signed,
    };
  } catch (error) {
    logMediaFailure("upload", error, {
      userId: input.userId,
      tenantId,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
    });
    throw error;
  } finally {
    recordMediaDuration("upload", Date.now() - startedAt);
  }
}

export async function listOwnedMedia(input: {
  userId: string;
  tenantId?: string;
  query: MediaListQuery;
}): Promise<{
  page: Awaited<ReturnType<typeof listOwnedMediaAssets>>;
  items: ReturnType<typeof toMediaApiRecord>[];
}> {
  const startedAt = Date.now();
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const actor = createScopedUserStorageActor(input.userId, tenantId);

  try {
    const page = await listOwnedMediaAssets(input.userId, tenantId, input.query);
    const items = page.items.map((item) => toMediaApiRecord(item, buildStoragePermissionMatrix(actor, toMediaResource(item))));

    logMediaEvent("list", {
      userId: input.userId,
      tenantId,
      count: items.length,
      page: input.query.page,
      perPage: input.query.perPage,
      mediaType: input.query.mediaType,
    });

    return { page, items };
  } catch (error) {
    logMediaFailure("list", error, {
      userId: input.userId,
      tenantId,
      page: input.query.page,
      perPage: input.query.perPage,
    });
    throw error;
  } finally {
    recordMediaDuration("list", Date.now() - startedAt);
  }
}

export async function getOwnedMediaDetail(input: { userId: string; mediaId: string }) {
  const startedAt = Date.now();
  const actor = createResourceUserStorageActor(input.userId);
  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "read",
      resourceType: "media",
      resourceId: input.mediaId,
    });
    const media = await getOwnedMediaAsset(resource.ownerUserId, input.mediaId, true);
    if (!media) {
      return null;
    }

    logMediaEvent("get", {
      userId: input.userId,
      mediaId: input.mediaId,
    });

    return toMediaApiRecord(media, buildStoragePermissionMatrix(actor, toMediaResource(media)));
  } catch (error) {
    logMediaFailure("get", error, {
      userId: input.userId,
      mediaId: input.mediaId,
    });
    throw error;
  } finally {
    recordMediaDuration("get", Date.now() - startedAt);
  }
}

export async function createOwnedMediaSignedUrl(input: {
  userId: string;
  mediaId: string;
  expiresInSeconds?: number;
}): Promise<MediaSignedAccess> {
  const startedAt = Date.now();
  const actor = createResourceUserStorageActor(input.userId);

  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "signed_url",
      resourceType: "media",
      resourceId: input.mediaId,
    });
    const media = await getOwnedMediaAsset(resource.ownerUserId, input.mediaId, true);
    if (!media) {
      throw new Error("Media not found.");
    }

    const signed = await createMediaSignedUrlFromRecord({
      actor,
      media,
      expiresInSeconds: input.expiresInSeconds,
      cacheKeyPrefix: input.userId,
    });

    logMediaEvent("signed_url", {
      userId: input.userId,
      mediaId: input.mediaId,
      expiresInSeconds: input.expiresInSeconds,
    });

    return signed;
  } catch (error) {
    logMediaFailure("signed_url", error, {
      userId: input.userId,
      mediaId: input.mediaId,
    });
    throw error;
  } finally {
    recordMediaDuration("signed_url", Date.now() - startedAt);
  }
}

export async function createMediaSignedUrlFromOwnerResource(input: {
  actor: StorageAccessActorContext;
  media: MediaAsset;
  cacheKeyPrefix: string;
  expiresInSeconds?: number;
}): Promise<MediaSignedAccess> {
  return createMediaSignedUrlFromRecord(input);
}

export async function deleteOwnedMedia(input: {
  userId: string;
  mediaId: string;
}): Promise<{ deleted: boolean }> {
  const startedAt = Date.now();
  const provider = getMediaStorageProvider();
  const actor = createResourceUserStorageActor(input.userId);

  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "delete",
      resourceType: "media",
      resourceId: input.mediaId,
    });
    const media = await getOwnedMediaAsset(resource.ownerUserId, input.mediaId, true);
    if (!media || media.status === "deleted") {
      return { deleted: false };
    }

    await provider.deleteObject({
      bucket: media.bucket,
      objectKey: media.objectKey,
    });

    await softDeleteMediaAsset(media);
    const updatedQuota = await updateMediaQuotaDelta({
      userId: media.userId,
      tenantId: media.tenantId,
      bytesDelta: -media.fileSizeBytes,
      filesDelta: -1,
      reason: "delete",
    });

    recordMediaQuota(updatedQuota.totalBytes, updatedQuota.totalFiles, media.mediaType);

    logMediaEvent("delete", {
      userId: input.userId,
      mediaId: input.mediaId,
      fileSizeBytes: media.fileSizeBytes,
    });

    return { deleted: true };
  } catch (error) {
    logMediaFailure("delete", error, {
      userId: input.userId,
      mediaId: input.mediaId,
    });
    throw error;
  } finally {
    recordMediaDuration("delete", Date.now() - startedAt);
  }
}
