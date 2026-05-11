import "server-only";

import { config } from "@/config";
import { createOwnedMediaSignedUrl, deleteOwnedMedia, uploadOwnedMedia } from "@/lib/media/workflow";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import { resolveTenantId } from "@/lib/media/model";
import { appendLifecycle, createAiAssetId, toAiAssetApiRecord } from "./model";
import { canTransitionAiAssetStatus } from "./lifecycle";
import { createVariantVersion, resolveOriginalAssetId } from "./variants";
import { logAiAssetEvent, logAiAssetFailure, recordAiAssetDuration } from "./monitoring";
import { createAiAssetRecord, getOwnedAiAsset, listOwnedAiAssetVariants, listOwnedAiAssets, updateAiAssetRecord } from "./storage";
import { validateRegisterAiAssetInput } from "./validation";
import type { AiAsset, AiAssetListQuery, AiAssetSignedAccess, RegisterAiAssetInput, ReplaceAiAssetInput } from "./types";

function createAiAsset(input: {
  id?: string;
  userId: string;
  tenantId: string;
  mediaId: string;
  assetType: AiAsset["assetType"];
  assetPurpose: AiAsset["assetPurpose"];
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  status: AiAsset["status"];
  sourceWorkflow?: string;
  generationProvider?: string;
  generationModel?: string;
  promptText?: string;
  promptHash?: string;
  generationSettings?: Record<string, unknown>;
  generationTarget?: Record<string, unknown>;
  originalAssetId?: string;
  parentAssetId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  contextMetadata?: Record<string, unknown>;
  isVariant?: boolean;
  version?: number;
}): AiAsset {
  const now = new Date().toISOString();
  return {
    id: input.id ?? createAiAssetId(),
    userId: input.userId,
    tenantId: input.tenantId,
    mediaId: input.mediaId,
    assetType: input.assetType,
    assetPurpose: input.assetPurpose,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    width: input.width,
    height: input.height,
    status: input.status,
    sourceWorkflow: input.sourceWorkflow,
    generationProvider: input.generationProvider,
    generationModel: input.generationModel,
    promptText: input.promptText,
    promptHash: input.promptHash,
    promptMetadata: {},
    generationSettings: input.generationSettings ?? {},
    generationTarget: input.generationTarget ?? {},
    originalAssetId: input.originalAssetId,
    parentAssetId: input.parentAssetId,
    replacementAssetId: undefined,
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
    contextMetadata: input.contextMetadata ?? {},
    usageMetadata: {},
    lifecycle: [{ status: input.status, at: now, note: "Asset registered." }],
    version: input.version ?? 1,
    isVariant: input.isVariant ?? false,
    archivedAt: undefined,
    deletedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export async function registerGeneratedAiAsset(input: RegisterAiAssetInput): Promise<{ asset: ReturnType<typeof toAiAssetApiRecord>; signed: AiAssetSignedAccess; }> {
  const startedAt = Date.now();
  const validation = validateRegisterAiAssetInput(input);
  const tenantId = resolveTenantId(input.userId, validation.normalized.tenantId);
  let uploadedMediaId: string | undefined;

  try {
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }

    let mediaId: string;
    let mimeType: string;
    let fileSizeBytes: number;

    if (input.mediaId) {
      const media = await getOwnedMediaAsset(input.userId, input.mediaId);
      if (!media) {
        throw new Error("Provided mediaId was not found.");
      }
      mediaId = media.id;
      mimeType = media.mimeType;
      fileSizeBytes = media.fileSizeBytes;
    } else {
      const uploaded = await uploadOwnedMedia({
        userId: input.userId,
        tenantId,
        fileName: validation.normalized.fileName ?? "generated-image.png",
        mimeType: validation.normalized.mimeType ?? "image/png",
        fileSizeBytes: validation.normalized.fileSizeBytes ?? 0,
        bytes: input.bytes as Uint8Array,
        mediaType: "generated_image",
        linkedContentId: validation.normalized.linkedContentId,
        linkedContentType: validation.normalized.linkedContentType,
        usageContext: "asset",
        width: input.width,
        height: input.height,
        metadata: {
          sourceWorkflow: input.sourceWorkflow,
          generationProvider: input.generationProvider,
          generationModel: input.generationModel,
        },
      });
      mediaId = uploaded.media.id;
      mimeType = uploaded.media.mimeType;
      fileSizeBytes = uploaded.media.fileSizeBytes;
      uploadedMediaId = mediaId;
    }

    const created = await createAiAssetRecord(createAiAsset({
      userId: input.userId,
      tenantId,
      mediaId,
      assetType: input.assetType ?? "image",
      assetPurpose: input.assetPurpose ?? "content",
      mimeType,
      fileSizeBytes,
      width: input.width,
      height: input.height,
      status: input.status ?? "available",
      sourceWorkflow: input.sourceWorkflow,
      generationProvider: input.generationProvider,
      generationModel: input.generationModel,
      promptText: validation.normalized.promptText,
      promptHash: validation.normalized.promptHash,
      generationSettings: validation.normalized.generationSettings,
      generationTarget: validation.normalized.generationTarget,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      originalAssetId: input.originalAssetId,
      parentAssetId: input.parentAssetId,
      contextMetadata: input.contextMetadata,
      isVariant: Boolean(input.originalAssetId),
      version: 1,
    }));

    const signed = await createOwnedAiAssetSignedUrl({ userId: input.userId, assetId: created.id });

    logAiAssetEvent("register", {
      userId: input.userId,
      tenantId,
      assetId: created.id,
      mediaId: created.mediaId,
      status: created.status,
    });

    return {
      asset: toAiAssetApiRecord(created),
      signed,
    };
  } catch (error) {
    if (uploadedMediaId) {
      await deleteOwnedMedia({ userId: input.userId, mediaId: uploadedMediaId });
    }

    logAiAssetFailure("register", error, {
      userId: input.userId,
      tenantId,
      sourceWorkflow: input.sourceWorkflow,
    });
    throw error;
  } finally {
    recordAiAssetDuration("register", Date.now() - startedAt);
  }
}

export async function listOwnedAiAssetLibrary(input: { userId: string; tenantId?: string; query: AiAssetListQuery; }): Promise<{ page: Awaited<ReturnType<typeof listOwnedAiAssets>>; items: ReturnType<typeof toAiAssetApiRecord>[]; }> {
  const startedAt = Date.now();
  const tenantId = resolveTenantId(input.userId, input.tenantId);

  try {
    const page = await listOwnedAiAssets(input.userId, tenantId, input.query);
    const items = page.items.map(toAiAssetApiRecord);

    logAiAssetEvent("list", {
      userId: input.userId,
      tenantId,
      count: items.length,
      page: input.query.page,
      perPage: input.query.perPage,
    });

    return { page, items };
  } catch (error) {
    logAiAssetFailure("list", error, {
      userId: input.userId,
      tenantId,
      page: input.query.page,
      perPage: input.query.perPage,
    });
    throw error;
  } finally {
    recordAiAssetDuration("list", Date.now() - startedAt);
  }
}

export async function getOwnedAiAssetDetail(input: { userId: string; assetId: string; }) {
  const startedAt = Date.now();
  try {
    const asset = await getOwnedAiAsset(input.userId, input.assetId);
    if (!asset) return null;

    logAiAssetEvent("get", {
      userId: input.userId,
      assetId: input.assetId,
    });

    return toAiAssetApiRecord(asset);
  } catch (error) {
    logAiAssetFailure("get", error, {
      userId: input.userId,
      assetId: input.assetId,
    });
    throw error;
  } finally {
    recordAiAssetDuration("get", Date.now() - startedAt);
  }
}

export async function createOwnedAiAssetSignedUrl(input: {
  userId: string;
  assetId: string;
  expiresInSeconds?: number;
}): Promise<AiAssetSignedAccess> {
  const startedAt = Date.now();
  try {
    const asset = await getOwnedAiAsset(input.userId, input.assetId);
    if (!asset) {
      throw new Error("AI asset not found.");
    }

    const signed = await createOwnedMediaSignedUrl({
      userId: input.userId,
      mediaId: asset.mediaId,
      expiresInSeconds: input.expiresInSeconds ?? config.services.media.signedUrlTtlSeconds,
    });

    logAiAssetEvent("signed_url", {
      userId: input.userId,
      assetId: input.assetId,
    });

    return {
      assetId: asset.id,
      mediaId: asset.mediaId,
      url: signed.url,
      expiresAt: signed.expiresAt,
    };
  } catch (error) {
    logAiAssetFailure("signed_url", error, {
      userId: input.userId,
      assetId: input.assetId,
    });
    throw error;
  } finally {
    recordAiAssetDuration("signed_url", Date.now() - startedAt);
  }
}

export async function deleteOwnedAiAsset(input: { userId: string; assetId: string; }): Promise<{ deleted: boolean }> {
  const startedAt = Date.now();
  try {
    const asset = await getOwnedAiAsset(input.userId, input.assetId, true);
    if (!asset || asset.status === "deleted") {
      return { deleted: false };
    }

    await deleteOwnedMedia({ userId: input.userId, mediaId: asset.mediaId });

    const now = new Date().toISOString();
    await updateAiAssetRecord({
      ...asset,
      status: "deleted",
      deletedAt: now,
      updatedAt: now,
      lifecycle: appendLifecycle(asset, "deleted", "Asset deleted and media cleaned up."),
    });

    logAiAssetEvent("delete", {
      userId: input.userId,
      assetId: input.assetId,
    });

    return { deleted: true };
  } catch (error) {
    logAiAssetFailure("delete", error, {
      userId: input.userId,
      assetId: input.assetId,
    });
    throw error;
  } finally {
    recordAiAssetDuration("delete", Date.now() - startedAt);
  }
}

export async function replaceOwnedAiAsset(input: ReplaceAiAssetInput): Promise<{ asset: ReturnType<typeof toAiAssetApiRecord>; signed: AiAssetSignedAccess; }> {
  const startedAt = Date.now();
  try {
    const existing = await getOwnedAiAsset(input.userId, input.assetId);
    if (!existing) {
      throw new Error("AI asset not found.");
    }

    const replacement = await registerGeneratedAiAsset({
      ...input,
      parentAssetId: existing.id,
      originalAssetId: resolveOriginalAssetId(existing),
      status: "available",
      assetType: input.assetType ?? existing.assetType,
      assetPurpose: input.assetPurpose ?? existing.assetPurpose,
      linkedContentId: input.linkedContentId ?? existing.linkedContentId,
      linkedContentType: input.linkedContentType ?? existing.linkedContentType,
      generationProvider: input.generationProvider ?? existing.generationProvider,
      generationModel: input.generationModel ?? existing.generationModel,
      sourceWorkflow: input.sourceWorkflow ?? existing.sourceWorkflow,
    });

    const now = new Date().toISOString();
    if (!canTransitionAiAssetStatus(existing.status, "archived")) {
      throw new Error(`Cannot archive asset from status '${existing.status}'.`);
    }

    await updateAiAssetRecord({
      ...existing,
      status: "archived",
      replacementAssetId: replacement.asset.id,
      archivedAt: now,
      updatedAt: now,
      lifecycle: appendLifecycle(existing, "archived", `Replaced by ${replacement.asset.id}.`),
    });

    const replacementAsset = await getOwnedAiAsset(input.userId, replacement.asset.id);
    if (replacementAsset) {
      await updateAiAssetRecord({
        ...replacementAsset,
        version: createVariantVersion(existing),
        parentAssetId: existing.id,
        originalAssetId: resolveOriginalAssetId(existing),
        updatedAt: new Date().toISOString(),
      });
    }

    logAiAssetEvent("replace", {
      userId: input.userId,
      assetId: existing.id,
      replacementAssetId: replacement.asset.id,
    });

    const refreshed = await getOwnedAiAsset(input.userId, replacement.asset.id);
    if (!refreshed) {
      throw new Error("Replacement asset was not found after creation.");
    }

    return {
      asset: toAiAssetApiRecord(refreshed),
      signed: replacement.signed,
    };
  } catch (error) {
    logAiAssetFailure("replace", error, {
      userId: input.userId,
      assetId: input.assetId,
    });
    throw error;
  } finally {
    recordAiAssetDuration("replace", Date.now() - startedAt);
  }
}

export async function listOwnedAiVariants(input: { userId: string; assetId: string; }): Promise<ReturnType<typeof toAiAssetApiRecord>[]> {
  const startedAt = Date.now();
  try {
    const parent = await getOwnedAiAsset(input.userId, input.assetId);
    if (!parent) {
      throw new Error("AI asset not found.");
    }

    const variants = await listOwnedAiAssetVariants(input.userId, parent.tenantId, resolveOriginalAssetId(parent));
    logAiAssetEvent("variant", {
      userId: input.userId,
      assetId: input.assetId,
      count: variants.length,
    });
    return variants.map(toAiAssetApiRecord);
  } catch (error) {
    logAiAssetFailure("variant", error, {
      userId: input.userId,
      assetId: input.assetId,
    });
    throw error;
  } finally {
    recordAiAssetDuration("variant", Date.now() - startedAt);
  }
}

export async function createOwnedAiVariant(input: ReplaceAiAssetInput): Promise<{ asset: ReturnType<typeof toAiAssetApiRecord>; signed: AiAssetSignedAccess; }> {
  const parent = await getOwnedAiAsset(input.userId, input.assetId);
  if (!parent) {
    throw new Error("Parent asset not found.");
  }

  const variant = await registerGeneratedAiAsset({
    ...input,
    parentAssetId: parent.id,
    originalAssetId: resolveOriginalAssetId(parent),
    status: "available",
    assetPurpose: input.assetPurpose ?? "variant",
    linkedContentId: input.linkedContentId ?? parent.linkedContentId,
    linkedContentType: input.linkedContentType ?? parent.linkedContentType,
    sourceWorkflow: input.sourceWorkflow ?? parent.sourceWorkflow,
  });

  const created = await getOwnedAiAsset(input.userId, variant.asset.id);
  if (!created) {
    throw new Error("Variant asset was not found after creation.");
  }

  const updated = await updateAiAssetRecord({
    ...created,
    isVariant: true,
    version: createVariantVersion(parent),
    updatedAt: new Date().toISOString(),
  });

  return {
    asset: toAiAssetApiRecord(updated),
    signed: variant.signed,
  };
}
