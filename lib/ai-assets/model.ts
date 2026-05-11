import { createHash } from "node:crypto";
import type { AiAsset, AiAssetApiRecord, AiAssetRow, AiAssetStatus, AiAssetType } from "./types";

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

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toLifecycle(value: unknown): AiAsset["lifecycle"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { status: AiAssetStatus; at: string; note?: string } => Boolean(entry && typeof entry === "object"))
    .map((entry) => ({
      status: entry.status,
      at: entry.at,
      note: entry.note,
    }));
}

export function createAiAssetId(): string {
  return `aias_${Date.now().toString(36)}_${randomSuffix().slice(0, 12)}`;
}

export function hashPrompt(value: string | undefined): string | undefined {
  const prompt = value?.trim();
  if (!prompt) return undefined;
  return createHash("sha256").update(prompt).digest("hex");
}

export function clampAiAssetPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, value);
}

export function clampAiAssetPerPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 20;
  return Math.min(100, Math.max(1, value));
}

export function parseAiAssetType(value: string | null | undefined): AiAssetType | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const values: AiAssetType[] = ["image", "thumbnail", "optimized", "social", "cropped", "resized", "other"];
  return values.includes(normalized as AiAssetType) ? (normalized as AiAssetType) : undefined;
}

export function fromAiAssetRow(row: AiAssetRow): AiAsset {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    mediaId: row.media_id,
    assetType: row.asset_type,
    assetPurpose: row.asset_purpose,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    status: row.status,
    sourceWorkflow: row.source_workflow ?? undefined,
    generationProvider: row.generation_provider ?? undefined,
    generationModel: row.generation_model ?? undefined,
    promptText: row.prompt_text ?? undefined,
    promptHash: row.prompt_hash ?? undefined,
    promptMetadata: toRecord(row.prompt_metadata_json),
    generationSettings: toRecord(row.generation_settings_json),
    generationTarget: toRecord(row.generation_target_json),
    originalAssetId: row.original_asset_id ?? undefined,
    parentAssetId: row.parent_asset_id ?? undefined,
    replacementAssetId: row.replacement_asset_id ?? undefined,
    linkedContentId: row.linked_content_id ?? undefined,
    linkedContentType: row.linked_content_type ?? undefined,
    contextMetadata: toRecord(row.context_metadata_json),
    usageMetadata: toRecord(row.usage_metadata_json),
    lifecycle: toLifecycle(row.lifecycle_json),
    version: row.version,
    isVariant: row.is_variant,
    archivedAt: row.archived_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAiAssetRow(asset: AiAsset): AiAssetRow {
  return {
    id: asset.id,
    user_id: asset.userId,
    tenant_id: asset.tenantId,
    media_id: asset.mediaId,
    asset_type: asset.assetType,
    asset_purpose: asset.assetPurpose,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSizeBytes,
    width: asset.width ?? null,
    height: asset.height ?? null,
    status: asset.status,
    source_workflow: asset.sourceWorkflow ?? null,
    generation_provider: asset.generationProvider ?? null,
    generation_model: asset.generationModel ?? null,
    prompt_text: asset.promptText ?? null,
    prompt_hash: asset.promptHash ?? null,
    prompt_metadata_json: asset.promptMetadata,
    generation_settings_json: asset.generationSettings,
    generation_target_json: asset.generationTarget,
    original_asset_id: asset.originalAssetId ?? null,
    parent_asset_id: asset.parentAssetId ?? null,
    replacement_asset_id: asset.replacementAssetId ?? null,
    linked_content_id: asset.linkedContentId ?? null,
    linked_content_type: asset.linkedContentType ?? null,
    context_metadata_json: asset.contextMetadata,
    usage_metadata_json: asset.usageMetadata,
    lifecycle_json: asset.lifecycle,
    version: asset.version,
    is_variant: asset.isVariant,
    archived_at: asset.archivedAt ?? null,
    deleted_at: asset.deletedAt ?? null,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

export function toAiAssetApiRecord(asset: AiAsset): AiAssetApiRecord {
  return {
    id: asset.id,
    mediaId: asset.mediaId,
    assetType: asset.assetType,
    assetPurpose: asset.assetPurpose,
    mimeType: asset.mimeType,
    fileSizeBytes: asset.fileSizeBytes,
    width: asset.width,
    height: asset.height,
    status: asset.status,
    sourceWorkflow: asset.sourceWorkflow,
    generationProvider: asset.generationProvider,
    generationModel: asset.generationModel,
    promptHash: asset.promptHash,
    originalAssetId: asset.originalAssetId,
    parentAssetId: asset.parentAssetId,
    replacementAssetId: asset.replacementAssetId,
    linkedContentId: asset.linkedContentId,
    linkedContentType: asset.linkedContentType,
    isVariant: asset.isVariant,
    version: asset.version,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    signedUrlEndpoint: `/api/ai-assets/${encodeURIComponent(asset.id)}/signed-url`,
  };
}

export function appendLifecycle(asset: AiAsset, status: AiAssetStatus, note?: string): AiAsset["lifecycle"] {
  return [...asset.lifecycle, { status, at: new Date().toISOString(), note }];
}
