import type {
  FileUploadApiRecord,
  FileUploadAssociation,
  FileUploadAssociationApiRecord,
  FileUploadAssociationRow,
  FileUploadLifecycleEvent,
  FileUploadRecord,
  FileUploadRecordRow,
  FileUploadSource,
} from "./types";
import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toLifecycle(value: unknown): FileUploadLifecycleEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.status !== "string" || typeof record.at !== "string") return [];
    return [{
      status: record.status as FileUploadLifecycleEvent["status"],
      at: record.at,
      note: typeof record.note === "string" ? record.note : undefined,
      metadata: toRecord(record.metadata),
    }];
  });
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

export function createFileUploadId(): string {
  return `fupload_${Date.now().toString(36)}_${randomSuffix().slice(0, 12)}`;
}

export function createFileUploadAssociationId(uploadId: string): string {
  return `fuassoc_${uploadId.slice(0, 12)}_${randomSuffix().slice(0, 8)}`;
}

export function inferUsageContextFromSource(source: FileUploadSource) {
  switch (source) {
    case "website_editing":
      return "editing" as const;
    case "social_publishing":
      return "social" as const;
    case "content_management":
      return "review" as const;
    case "media_library":
    default:
      return "library" as const;
  }
}

export function fromFileUploadRow(row: FileUploadRecordRow): FileUploadRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    mediaId: row.media_id ?? undefined,
    source: row.source,
    status: row.status,
    usageContext: row.usage_context,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    mediaType: row.media_type,
    fileSizeBytes: row.file_size_bytes,
    linkedContentId: row.linked_content_id ?? undefined,
    linkedContentType: row.linked_content_type ?? undefined,
    retryCount: row.retry_count,
    lastErrorCode: row.last_error_code ?? undefined,
    lastErrorMessage: row.last_error_message ?? undefined,
    associationSummary: toRecord(row.association_summary_json),
    metadata: toRecord(row.metadata_json),
    lifecycle: toLifecycle(row.lifecycle_json),
    completedAt: row.completed_at ?? undefined,
    canceledAt: row.canceled_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toFileUploadRow(record: FileUploadRecord): FileUploadRecordRow {
  return {
    id: record.id,
    user_id: record.userId,
    tenant_id: record.tenantId,
    media_id: record.mediaId ?? null,
    source: record.source,
    status: record.status,
    usage_context: record.usageContext,
    original_filename: record.originalFilename,
    mime_type: record.mimeType,
    media_type: record.mediaType,
    file_size_bytes: record.fileSizeBytes,
    linked_content_id: record.linkedContentId ?? null,
    linked_content_type: record.linkedContentType ?? null,
    retry_count: record.retryCount,
    last_error_code: record.lastErrorCode ?? null,
    last_error_message: record.lastErrorMessage ?? null,
    association_summary_json: record.associationSummary,
    metadata_json: record.metadata,
    lifecycle_json: record.lifecycle,
    completed_at: record.completedAt ?? null,
    canceled_at: record.canceledAt ?? null,
    deleted_at: record.deletedAt ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function fromFileUploadAssociationRow(row: FileUploadAssociationRow): FileUploadAssociation {
  return {
    id: row.id,
    uploadId: row.upload_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    associationType: row.association_type,
    associationId: row.association_id,
    contentId: row.content_id ?? undefined,
    contentType: row.content_type ?? undefined,
    metadata: toRecord(row.metadata_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toFileUploadAssociationRow(record: FileUploadAssociation): FileUploadAssociationRow {
  return {
    id: record.id,
    upload_id: record.uploadId,
    user_id: record.userId,
    tenant_id: record.tenantId,
    association_type: record.associationType,
    association_id: record.associationId,
    content_id: record.contentId ?? null,
    content_type: record.contentType ?? null,
    metadata_json: record.metadata,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function createNewFileUploadRecord(input: {
  id?: string;
  userId: string;
  tenantId: string;
  source: FileUploadSource;
  status: FileUploadRecord["status"];
  usageContext: FileUploadRecord["usageContext"];
  originalFilename: string;
  mimeType: string;
  mediaType: FileUploadRecord["mediaType"];
  fileSizeBytes: number;
  linkedContentId?: string;
  linkedContentType?: string;
  metadata?: Record<string, unknown>;
  associationSummary?: Record<string, unknown>;
  lifecycle?: FileUploadLifecycleEvent[];
}): FileUploadRecord {
  const now = new Date().toISOString();
  return {
    id: input.id ?? createFileUploadId(),
    userId: input.userId,
    tenantId: input.tenantId,
    source: input.source,
    status: input.status,
    usageContext: input.usageContext,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    mediaType: input.mediaType,
    fileSizeBytes: input.fileSizeBytes,
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
    retryCount: 0,
    associationSummary: input.associationSummary ?? {},
    metadata: input.metadata ?? {},
    lifecycle: input.lifecycle ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createFileUploadAssociationRecord(input: {
  uploadId: string;
  userId: string;
  tenantId: string;
  associationType: FileUploadAssociation["associationType"];
  associationId: string;
  contentId?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}): FileUploadAssociation {
  const now = new Date().toISOString();
  return {
    id: createFileUploadAssociationId(input.uploadId),
    uploadId: input.uploadId,
    userId: input.userId,
    tenantId: input.tenantId,
    associationType: input.associationType,
    associationId: input.associationId,
    contentId: input.contentId,
    contentType: input.contentType,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

export function toFileUploadApiRecord(record: FileUploadRecord, permissions?: StorageClientPermissionMatrix): FileUploadApiRecord {
  const encoded = encodeURIComponent(record.id);
  return {
    id: record.id,
    mediaId: record.mediaId,
    source: record.source,
    status: record.status,
    usageContext: record.usageContext,
    originalFilename: record.originalFilename,
    mimeType: record.mimeType,
    mediaType: record.mediaType,
    fileSizeBytes: record.fileSizeBytes,
    linkedContentId: record.linkedContentId,
    linkedContentType: record.linkedContentType,
    retryCount: record.retryCount,
    lastErrorCode: record.lastErrorCode,
    lastErrorMessage: record.lastErrorMessage,
    associationSummary: record.associationSummary,
    lifecycle: record.lifecycle,
    completedAt: record.completedAt,
    canceledAt: record.canceledAt,
    deletedAt: record.deletedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    detailEndpoint: `/api/file-upload/${encoded}`,
    deleteEndpoint: `/api/file-upload/${encoded}/delete`,
    signedUrlEndpoint: `/api/file-upload/${encoded}/signed-url`,
    permissions,
  };
}

export function toFileUploadAssociationApiRecord(record: FileUploadAssociation): FileUploadAssociationApiRecord {
  return {
    id: record.id,
    associationType: record.associationType,
    associationId: record.associationId,
    contentId: record.contentId,
    contentType: record.contentType,
    metadata: record.metadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
