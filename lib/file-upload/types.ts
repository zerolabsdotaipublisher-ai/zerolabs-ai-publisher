import type { MediaApiRecord, MediaSignedAccess, MediaType, MediaUsageLink } from "@/lib/media/types";
import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";

export const FILE_UPLOAD_SOURCES = [
  "media_library",
  "website_editing",
  "social_publishing",
  "content_management",
] as const;

export type FileUploadSource = (typeof FILE_UPLOAD_SOURCES)[number];

export const FILE_UPLOAD_STATUSES = [
  "selected",
  "validating",
  "uploading",
  "uploaded",
  "failed",
  "canceled",
] as const;

export type FileUploadStatus = (typeof FILE_UPLOAD_STATUSES)[number];

export const FILE_UPLOAD_ASSOCIATION_TYPES = [
  "website",
  "page",
  "section",
  "content_record",
  "media_library",
  "website_media_library",
  "social_post",
] as const;

export type FileUploadAssociationType = (typeof FILE_UPLOAD_ASSOCIATION_TYPES)[number];

export interface FileUploadLifecycleEvent {
  status: FileUploadStatus;
  at: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadRecord {
  id: string;
  userId: string;
  tenantId: string;
  mediaId?: string;
  source: FileUploadSource;
  status: FileUploadStatus;
  usageContext: MediaUsageLink["usageContext"];
  originalFilename: string;
  mimeType: string;
  mediaType: MediaType;
  fileSizeBytes: number;
  linkedContentId?: string;
  linkedContentType?: string;
  retryCount: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  associationSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  lifecycle: FileUploadLifecycleEvent[];
  completedAt?: string;
  canceledAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadRecordRow {
  id: string;
  user_id: string;
  tenant_id: string;
  media_id?: string | null;
  source: FileUploadSource;
  status: FileUploadStatus;
  usage_context: MediaUsageLink["usageContext"];
  original_filename: string;
  mime_type: string;
  media_type: MediaType;
  file_size_bytes: number;
  linked_content_id?: string | null;
  linked_content_type?: string | null;
  retry_count: number;
  last_error_code?: string | null;
  last_error_message?: string | null;
  association_summary_json: unknown;
  metadata_json: unknown;
  lifecycle_json: unknown;
  completed_at?: string | null;
  canceled_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileUploadAssociation {
  id: string;
  uploadId: string;
  userId: string;
  tenantId: string;
  associationType: FileUploadAssociationType;
  associationId: string;
  contentId?: string;
  contentType?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadAssociationRow {
  id: string;
  upload_id: string;
  user_id: string;
  tenant_id: string;
  association_type: FileUploadAssociationType;
  association_id: string;
  content_id?: string | null;
  content_type?: string | null;
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface FileUploadAssociationInput {
  associationType: FileUploadAssociationType;
  associationId: string;
  contentId?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadInput {
  userId: string;
  tenantId?: string;
  retryUploadId?: string;
  source: FileUploadSource;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
  mediaType?: MediaType;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
  associations?: FileUploadAssociationInput[];
  metadata?: Record<string, unknown>;
}

export interface FileUploadApiRecord {
  id: string;
  mediaId?: string;
  source: FileUploadSource;
  status: FileUploadStatus;
  usageContext: MediaUsageLink["usageContext"];
  originalFilename: string;
  mimeType: string;
  mediaType: MediaType;
  fileSizeBytes: number;
  linkedContentId?: string;
  linkedContentType?: string;
  retryCount: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  associationSummary: Record<string, unknown>;
  lifecycle: FileUploadLifecycleEvent[];
  completedAt?: string;
  canceledAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  detailEndpoint: string;
  deleteEndpoint: string;
  signedUrlEndpoint: string;
  permissions?: StorageClientPermissionMatrix;
}

export interface FileUploadAssociationApiRecord {
  id: string;
  associationType: FileUploadAssociationType;
  associationId: string;
  contentId?: string;
  contentType?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadResult {
  upload: FileUploadApiRecord;
  associations: FileUploadAssociationApiRecord[];
  media?: MediaApiRecord;
  signed?: MediaSignedAccess;
}

export interface FileUploadDetailResult extends FileUploadResult {
  metadata: Record<string, unknown>;
}

export interface FileUploadSignedUrlQuery {
  expiresInSeconds?: number;
}

export interface FileUploadBatchItemInput {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
}

export interface FileUploadBatchInput {
  userId: string;
  tenantId?: string;
  source: FileUploadSource;
  usageContext?: MediaUsageLink["usageContext"];
  linkedContentId?: string;
  linkedContentType?: string;
  associations?: FileUploadAssociationInput[];
  metadata?: Record<string, unknown>;
  files: FileUploadBatchItemInput[];
}

export interface FileUploadBatchItemResult {
  ok: boolean;
  upload?: FileUploadApiRecord;
  associations?: FileUploadAssociationApiRecord[];
  media?: MediaApiRecord;
  signed?: MediaSignedAccess;
  error?: string;
}

export interface ParsedFileUploadBody {
  tenantId?: string;
  retryUploadId?: string;
  source?: FileUploadSource;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
  associations?: FileUploadAssociationInput[];
  metadata?: Record<string, unknown>;
}
