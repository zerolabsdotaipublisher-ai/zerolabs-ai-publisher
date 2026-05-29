import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { buildMediaNamespacePrefix, fromMediaRow } from "@/lib/media/model";
import type { MediaAssetRow } from "@/lib/media/types";
import { fromFileUploadRow } from "@/lib/file-upload/model";
import type { FileUploadRecordRow } from "@/lib/file-upload/types";
import { fromAiAssetRow } from "@/lib/ai-assets/model";
import type { AiAssetRow } from "@/lib/ai-assets/types";
import { fromWebsiteMediaLibraryItemRow } from "@/lib/website-media-library/model";
import type { WebsiteMediaLibraryItemRow } from "@/lib/website-media-library/types";
import { getWebsiteStructureById } from "@/lib/ai/structure";
import { detectPublicationState } from "@/lib/publish";
import { resolveWebsiteMediaVisibility } from "./public-private";
import type { StorageAccessResourceRecord, StorageResourceType } from "./types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getEnvironmentStage(metadata: Record<string, unknown>): string | undefined {
  const environmentStage = metadata.environmentStage;
  return typeof environmentStage === "string" && environmentStage.trim() ? environmentStage : undefined;
}

export async function resolveStorageResource(
  resourceType: StorageResourceType,
  resourceId: string,
): Promise<StorageAccessResourceRecord | null> {
  const supabase = getSupabaseServiceClient();

  if (resourceType === "media") {
    const { data, error } = await supabase.from("media_assets").select("*").eq("id", resourceId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const media = fromMediaRow(data as MediaAssetRow);
    return {
      resourceType,
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
      environmentStage: getEnvironmentStage(media.metadata),
    };
  }

  if (resourceType === "file_upload") {
    const { data, error } = await supabase.from("file_uploads").select("*").eq("id", resourceId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const upload = fromFileUploadRow(data as FileUploadRecordRow);
    return {
      resourceType,
      resourceId: upload.id,
      ownerUserId: upload.userId,
      tenantId: upload.tenantId,
      mediaId: upload.mediaId,
      linkedContentId: upload.linkedContentId,
      linkedContentType: upload.linkedContentType,
      status: upload.status,
      visibility: "private",
      deletedAt: upload.deletedAt,
      metadata: upload.metadata,
      environmentStage: getEnvironmentStage(upload.metadata),
    };
  }

  if (resourceType === "ai_asset") {
    const { data, error } = await supabase.from("ai_assets").select("*").eq("id", resourceId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const asset = fromAiAssetRow(data as AiAssetRow);
    return {
      resourceType,
      resourceId: asset.id,
      ownerUserId: asset.userId,
      tenantId: asset.tenantId,
      mediaId: asset.mediaId,
      linkedContentId: asset.linkedContentId,
      linkedContentType: asset.linkedContentType,
      status: asset.status,
      visibility: asset.status === "published" ? "protected" : "private",
      deletedAt: asset.deletedAt,
      metadata: asset.contextMetadata,
      environmentStage: getEnvironmentStage(asset.contextMetadata),
    };
  }

  const { data, error } = await supabase.from("website_media_library_items").select("*").eq("id", resourceId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const item = fromWebsiteMediaLibraryItemRow(data as WebsiteMediaLibraryItemRow);
  const metadata = {
    ...item.metadata,
    usageSummary: item.usageSummary,
    associationSummary: item.associationSummary,
  };
  const website = item.websiteId ? await getWebsiteStructureById(item.websiteId) : null;
  const publication = website ? detectPublicationState(website) : null;
  return {
    resourceType,
    resourceId: item.id,
    ownerUserId: item.userId,
    tenantId: item.tenantId,
    mediaId: item.mediaId,
    websiteId: item.websiteId,
    status: item.deletedAt ? "deleted" : item.archivedAt ? "archived" : "active",
    visibility: resolveWebsiteMediaVisibility(item, publication?.state),
    deletedAt: item.deletedAt,
    metadata: toRecord(metadata),
    environmentStage: getEnvironmentStage(metadata),
  };
}
