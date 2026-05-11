export type MediaType = "image" | "video" | "document" | "thumbnail" | "asset" | "generated_image" | "file";

export type MediaProvider = "wasabi" | "s3-compatible";

export interface MediaDimensions {
  width?: number;
  height?: number;
}

export interface MediaAsset {
  id: string;
  userId: string;
  tenantId: string;
  provider: MediaProvider;
  bucket: string;
  objectKey: string;
  mediaType: MediaType;
  mimeType: string;
  originalFilename: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  linkedContentId?: string;
  linkedContentType?: string;
  usageMetadata: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: "active" | "deleted";
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetRow {
  id: string;
  user_id: string;
  tenant_id: string;
  provider: MediaProvider;
  bucket: string;
  object_key: string;
  media_type: MediaType;
  mime_type: string;
  original_filename: string;
  file_size_bytes: number;
  width?: number | null;
  height?: number | null;
  linked_content_id?: string | null;
  linked_content_type?: string | null;
  usage_metadata_json: unknown;
  metadata_json: unknown;
  status: "active" | "deleted";
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaUsageLink {
  id: string;
  mediaId: string;
  userId: string;
  tenantId: string;
  contentId?: string;
  contentType?: string;
  usageContext: "library" | "editing" | "review" | "publishing" | "social" | "thumbnail" | "asset";
  createdAt: string;
}

export interface MediaUsageLinkRow {
  id: string;
  media_id: string;
  user_id: string;
  tenant_id: string;
  content_id?: string | null;
  content_type?: string | null;
  usage_context: MediaUsageLink["usageContext"];
  created_at: string;
}

export interface MediaQuotaUsage {
  id: string;
  userId: string;
  tenantId: string;
  totalBytes: number;
  totalFiles: number;
  lastUploadAt?: string;
  lastDeleteAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MediaQuotaUsageRow {
  id: string;
  user_id: string;
  tenant_id: string;
  total_bytes: number;
  total_files: number;
  last_upload_at?: string | null;
  last_delete_at?: string | null;
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface MediaUploadInput {
  userId: string;
  tenantId?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
  mediaType?: MediaType;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}

export interface MediaListQuery {
  page: number;
  perPage: number;
  mediaType?: MediaType;
  linkedContentId?: string;
  linkedContentType?: string;
  search?: string;
  includeDeleted?: boolean;
}

export interface MediaListResult {
  items: MediaAsset[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface MediaSignedAccess {
  mediaId: string;
  url: string;
  expiresAt: string;
}

export interface MediaApiRecord {
  id: string;
  mediaType: MediaType;
  mimeType: string;
  originalFilename: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  linkedContentId?: string;
  linkedContentType?: string;
  createdAt: string;
  updatedAt: string;
  signedUrlEndpoint: string;
}

export interface MediaSignedUrlQuery {
  expiresInSeconds?: number;
}

export interface MediaUploadApiPayload {
  tenantId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
}
