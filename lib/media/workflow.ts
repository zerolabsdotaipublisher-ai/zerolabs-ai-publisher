import "server-only";

import { config } from "@/config";
import { getMediaStorageProvider } from "./provider";
import { buildMediaObjectKey, createMediaId, resolveMediaProvider, resolveTenantId, toMediaApiRecord } from "./model";
import { canAccessMediaRecord } from "./permissions";
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
import type { MediaListQuery, MediaSignedAccess, MediaUploadInput } from "./types";


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

export async function uploadOwnedMedia(input: MediaUploadInput): Promise<{
  media: ReturnType<typeof toMediaApiRecord>;
  signed: MediaSignedAccess;
}> {
  const startedAt = Date.now();
  const provider = getMediaStorageProvider();
  const bucket = resolveBucket();
  const tenantId = resolveTenantId(input.userId, input.tenantId);

  try {
    const permission = canAccessMediaRecord(input.userId, input.userId);
    if (!permission.allowed) {
      throw new Error(permission.reason || "Unauthorized media upload.");
    }

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
        metadata: input.metadata,
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

    logMediaEvent("upload", {
      userId: input.userId,
      tenantId,
      mediaId: created.id,
      mediaType: created.mediaType,
      fileSizeBytes: created.fileSizeBytes,
    });

    return {
      media: toMediaApiRecord(created),
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

  try {
    const page = await listOwnedMediaAssets(input.userId, tenantId, input.query);
    const items = page.items.map(toMediaApiRecord);

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
  try {
    const media = await getOwnedMediaAsset(input.userId, input.mediaId);
    if (!media) {
      return null;
    }

    logMediaEvent("get", {
      userId: input.userId,
      mediaId: input.mediaId,
    });

    return toMediaApiRecord(media);
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
  const provider = getMediaStorageProvider();

  try {
    const media = await getOwnedMediaAsset(input.userId, input.mediaId);
    if (!media) {
      throw new Error("Media not found.");
    }

    const expiresInSeconds = input.expiresInSeconds ?? config.services.media.signedUrlTtlSeconds;
    const nowMs = Date.now();
    pruneSignedUrlCache(nowMs);
    const cacheKey = `${input.userId}:${media.id}:${expiresInSeconds}`;
    const cached = signedUrlCache.get(cacheKey);
    if (cached && cached.expiresAtMs > nowMs + SIGNED_URL_CACHE_BUFFER_MS) {
      logMediaEvent("signed_url", {
        userId: input.userId,
        mediaId: input.mediaId,
        expiresInSeconds,
        cacheHit: true,
      });
      return {
        mediaId: media.id,
        url: cached.url,
        expiresAt: new Date(cached.expiresAtMs).toISOString(),
      };
    }

    const url = await provider.createSignedReadUrl({
      bucket: media.bucket,
      objectKey: media.objectKey,
      expiresInSeconds,
    });

    const expiresAtMs = nowMs + expiresInSeconds * 1000;
    signedUrlCache.set(cacheKey, { url, expiresAtMs });
    const expiresAt = new Date(expiresAtMs).toISOString();

    logMediaEvent("signed_url", {
      userId: input.userId,
      mediaId: input.mediaId,
      expiresInSeconds,
    });

    return {
      mediaId: media.id,
      url,
      expiresAt,
    };
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

export async function deleteOwnedMedia(input: {
  userId: string;
  mediaId: string;
}): Promise<{ deleted: boolean }> {
  const startedAt = Date.now();
  const provider = getMediaStorageProvider();

  try {
    const media = await getOwnedMediaAsset(input.userId, input.mediaId, true);
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
