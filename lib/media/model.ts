import { config } from "@/config";
import type {
  MediaApiRecord,
  MediaAsset,
  MediaAssetRow,
  MediaProvider,
  MediaQuotaUsage,
  MediaQuotaUsageRow,
  MediaType,
  MediaUsageLink,
  MediaUsageLinkRow,
} from "./types";
import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function inferMediaType(mimeType: string): MediaType {
  const value = mimeType.toLowerCase();
  if (value.startsWith("image/")) return "image";
  if (value.startsWith("video/")) return "video";
  if (value.includes("pdf") || value.includes("msword") || value.includes("officedocument") || value.startsWith("text/")) {
    return "document";
  }
  return "file";
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

export function createMediaId(): string {
  return `media_${Date.now().toString(36)}_${randomSuffix().slice(0, 12)}`;
}

export function createMediaUsageLinkId(mediaId: string): string {
  return `mul_${mediaId.slice(0, 12)}_${randomSuffix().slice(0, 8)}`;
}

export function createMediaQuotaId(userId: string, tenantId: string): string {
  return `mquota_${tenantId.slice(0, 8)}_${userId.slice(0, 8)}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "upload.bin";
}

export function buildMediaNamespacePrefix(tenantId: string): string {
  return `tenant/${tenantId}/ai-publisher`;
}

export function buildMediaObjectKey(tenantId: string, mediaId: string, fileName: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${buildMediaNamespacePrefix(tenantId)}/${date}/${mediaId}/${sanitizeFileName(fileName)}`;
}

export function fromMediaRow(row: MediaAssetRow): MediaAsset {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    provider: row.provider,
    bucket: row.bucket,
    objectKey: row.object_key,
    mediaType: row.media_type,
    mimeType: row.mime_type,
    originalFilename: row.original_filename,
    fileSizeBytes: row.file_size_bytes,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    linkedContentId: row.linked_content_id ?? undefined,
    linkedContentType: row.linked_content_type ?? undefined,
    usageMetadata: toRecord(row.usage_metadata_json),
    metadata: toRecord(row.metadata_json),
    status: row.status,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMediaRow(asset: MediaAsset): MediaAssetRow {
  return {
    id: asset.id,
    user_id: asset.userId,
    tenant_id: asset.tenantId,
    provider: asset.provider,
    bucket: asset.bucket,
    object_key: asset.objectKey,
    media_type: asset.mediaType,
    mime_type: asset.mimeType,
    original_filename: asset.originalFilename,
    file_size_bytes: asset.fileSizeBytes,
    width: asset.width ?? null,
    height: asset.height ?? null,
    linked_content_id: asset.linkedContentId ?? null,
    linked_content_type: asset.linkedContentType ?? null,
    usage_metadata_json: asset.usageMetadata,
    metadata_json: asset.metadata,
    status: asset.status,
    deleted_at: asset.deletedAt ?? null,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

export function fromUsageLinkRow(row: MediaUsageLinkRow): MediaUsageLink {
  return {
    id: row.id,
    mediaId: row.media_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    contentId: row.content_id ?? undefined,
    contentType: row.content_type ?? undefined,
    usageContext: row.usage_context,
    createdAt: row.created_at,
  };
}

export function toUsageLinkRow(link: MediaUsageLink): MediaUsageLinkRow {
  return {
    id: link.id,
    media_id: link.mediaId,
    user_id: link.userId,
    tenant_id: link.tenantId,
    content_id: link.contentId ?? null,
    content_type: link.contentType ?? null,
    usage_context: link.usageContext,
    created_at: link.createdAt,
  };
}

export function fromQuotaRow(row: MediaQuotaUsageRow): MediaQuotaUsage {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    totalBytes: row.total_bytes,
    totalFiles: row.total_files,
    lastUploadAt: row.last_upload_at ?? undefined,
    lastDeleteAt: row.last_delete_at ?? undefined,
    metadata: toRecord(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toQuotaRow(quota: MediaQuotaUsage): MediaQuotaUsageRow {
  return {
    id: quota.id,
    user_id: quota.userId,
    tenant_id: quota.tenantId,
    total_bytes: quota.totalBytes,
    total_files: quota.totalFiles,
    last_upload_at: quota.lastUploadAt ?? null,
    last_delete_at: quota.lastDeleteAt ?? null,
    metadata_json: quota.metadata,
    created_at: quota.createdAt,
    updated_at: quota.updatedAt,
  };
}

export function clampMediaPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, value);
}

export function clampMediaPerPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 20;
  return Math.min(100, Math.max(1, value));
}

export function toMediaApiRecord(asset: MediaAsset, permissions?: StorageClientPermissionMatrix): MediaApiRecord {
  return {
    id: asset.id,
    mediaType: asset.mediaType,
    mimeType: asset.mimeType,
    originalFilename: asset.originalFilename,
    fileSizeBytes: asset.fileSizeBytes,
    width: asset.width,
    height: asset.height,
    linkedContentId: asset.linkedContentId,
    linkedContentType: asset.linkedContentType,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    signedUrlEndpoint: `/api/media/${encodeURIComponent(asset.id)}/signed-url`,
    permissions,
  };
}

export function resolveTenantId(userId: string, requestedTenantId?: string): string {
  const tenant = requestedTenantId?.trim();
  return tenant && tenant.length > 0 ? tenant : userId;
}

export function resolveMediaProvider(): MediaProvider {
  return config.services.media.provider === "s3-compatible" ? "s3-compatible" : "wasabi";
}
