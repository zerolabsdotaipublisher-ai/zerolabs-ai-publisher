import type { StorageClientPermissionMatrix } from "@/lib/storage-access/types";

export type AiAssetType = "image" | "thumbnail" | "optimized" | "social" | "cropped" | "resized" | "other";

export type AiAssetPurpose = "hero" | "content" | "social" | "thumbnail" | "ad" | "variant" | "other";

export type AiAssetStatus = "generating" | "available" | "attached" | "published" | "archived" | "failed" | "deleted";

export interface AiAssetGenerationTarget {
  workflow?: string;
  target?: string;
  eventRef?: string;
  style?: string;
  options?: Record<string, unknown>;
}

export interface AiAssetContentAssociation {
  linkedContentId?: string;
  linkedContentType?: string;
  contentTarget?: string;
}

export interface AiAsset {
  id: string;
  userId: string;
  tenantId: string;
  mediaId: string;
  assetType: AiAssetType;
  assetPurpose: AiAssetPurpose;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  status: AiAssetStatus;
  sourceWorkflow?: string;
  generationProvider?: string;
  generationModel?: string;
  promptText?: string;
  promptHash?: string;
  promptMetadata: Record<string, unknown>;
  generationSettings: Record<string, unknown>;
  generationTarget: AiAssetGenerationTarget;
  originalAssetId?: string;
  parentAssetId?: string;
  replacementAssetId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  contextMetadata: Record<string, unknown>;
  usageMetadata: Record<string, unknown>;
  lifecycle: Array<{ status: AiAssetStatus; at: string; note?: string }>;
  version: number;
  isVariant: boolean;
  archivedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiAssetRow {
  id: string;
  user_id: string;
  tenant_id: string;
  media_id: string;
  asset_type: AiAssetType;
  asset_purpose: AiAssetPurpose;
  mime_type: string;
  file_size_bytes: number;
  width?: number | null;
  height?: number | null;
  status: AiAssetStatus;
  source_workflow?: string | null;
  generation_provider?: string | null;
  generation_model?: string | null;
  prompt_text?: string | null;
  prompt_hash?: string | null;
  prompt_metadata_json: unknown;
  generation_settings_json: unknown;
  generation_target_json: unknown;
  original_asset_id?: string | null;
  parent_asset_id?: string | null;
  replacement_asset_id?: string | null;
  linked_content_id?: string | null;
  linked_content_type?: string | null;
  context_metadata_json: unknown;
  usage_metadata_json: unknown;
  lifecycle_json: unknown;
  version: number;
  is_variant: boolean;
  archived_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiAssetListQuery {
  page: number;
  perPage: number;
  status?: AiAssetStatus;
  assetType?: AiAssetType;
  linkedContentId?: string;
  linkedContentType?: string;
  originalAssetId?: string;
  search?: string;
  includeDeleted?: boolean;
}

export interface AiAssetListResult {
  items: AiAsset[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface AiAssetApiRecord {
  id: string;
  mediaId: string;
  assetType: AiAssetType;
  assetPurpose: AiAssetPurpose;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  status: AiAssetStatus;
  sourceWorkflow?: string;
  generationProvider?: string;
  generationModel?: string;
  promptHash?: string;
  originalAssetId?: string;
  parentAssetId?: string;
  replacementAssetId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  isVariant: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  signedUrlEndpoint: string;
  permissions?: StorageClientPermissionMatrix;
}

export interface AiAssetSignedAccess {
  assetId: string;
  mediaId: string;
  url: string;
  expiresAt: string;
}

export interface RegisterAiAssetInput {
  userId: string;
  tenantId?: string;
  mediaId?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  bytes?: Uint8Array;
  width?: number;
  height?: number;
  assetType?: AiAssetType;
  assetPurpose?: AiAssetPurpose;
  status?: AiAssetStatus;
  sourceWorkflow?: string;
  generationProvider?: string;
  generationModel?: string;
  promptText?: string;
  generationSettings?: Record<string, unknown>;
  generationTarget?: AiAssetGenerationTarget;
  linkedContentId?: string;
  linkedContentType?: string;
  originalAssetId?: string;
  parentAssetId?: string;
  contextMetadata?: Record<string, unknown>;
}

export interface ReplaceAiAssetInput extends RegisterAiAssetInput {
  assetId: string;
}

export interface AiAssetSignedUrlQuery {
  expiresInSeconds?: number;
}
