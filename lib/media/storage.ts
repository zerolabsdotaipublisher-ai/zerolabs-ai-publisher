import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createMediaId, createMediaQuotaId, createMediaUsageLinkId, fromMediaRow, fromQuotaRow, toMediaRow, toUsageLinkRow } from "./model";
import type { MediaAsset, MediaAssetRow, MediaListQuery, MediaListResult, MediaQuotaUsage, MediaQuotaUsageRow, MediaUsageLink, MediaUsageLinkRow } from "./types";

export async function createMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("media_assets").insert(toMediaRow(asset)).select("*").single();

  if (error) throw error;
  return fromMediaRow(data as MediaAssetRow);
}

export async function getOwnedMediaAsset(userId: string, mediaId: string, includeDeleted = false): Promise<MediaAsset | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("media_assets").select("*").eq("user_id", userId).eq("id", mediaId);
  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromMediaRow(data as MediaAssetRow) : null;
}

export async function listOwnedMediaAssets(userId: string, tenantId: string, query: MediaListQuery): Promise<MediaListResult> {
  const supabase = getSupabaseServiceClient();

  let base = supabase.from("media_assets").select("*", { count: "exact" }).eq("user_id", userId).eq("tenant_id", tenantId);
  if (!query.includeDeleted) {
    base = base.is("deleted_at", null);
  }
  if (query.mediaType) {
    base = base.eq("media_type", query.mediaType);
  }
  if (query.linkedContentId) {
    base = base.eq("linked_content_id", query.linkedContentId);
  }
  if (query.linkedContentType) {
    base = base.eq("linked_content_type", query.linkedContentType);
  }
  if (query.search) {
    base = base.ilike("original_filename", `%${query.search}%`);
  }

  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;

  const { data, count, error } = await base.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const items = ((data ?? []) as MediaAssetRow[]).map(fromMediaRow);
  const total = count ?? items.length;

  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    hasMore: from + items.length < total,
  };
}

export async function saveMediaUsageLink(link: MediaUsageLink): Promise<MediaUsageLink> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("media_usage_links")
    .upsert(toUsageLinkRow(link), { onConflict: "media_id,content_id,content_type,usage_context" })
    .select("*")
    .single();

  if (error) throw error;

  const row = data as MediaUsageLinkRow;
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

export async function listMediaUsageLinks(mediaId: string, userId: string): Promise<MediaUsageLink[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("media_usage_links")
    .select("*")
    .eq("media_id", mediaId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MediaUsageLinkRow[]).map((row) => ({
    id: row.id,
    mediaId: row.media_id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    contentId: row.content_id ?? undefined,
    contentType: row.content_type ?? undefined,
    usageContext: row.usage_context,
    createdAt: row.created_at,
  }));
}

export async function softDeleteMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("media_assets")
    .update({ status: "deleted", deleted_at: now, updated_at: now })
    .eq("id", asset.id)
    .eq("user_id", asset.userId)
    .select("*")
    .single();

  if (error) throw error;
  return fromMediaRow(data as MediaAssetRow);
}

export async function getOrCreateMediaQuota(userId: string, tenantId: string): Promise<MediaQuotaUsage> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("media_usage_quotas")
    .select("*")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return fromQuotaRow(data as MediaQuotaUsageRow);
  }

  const now = new Date().toISOString();
  const created: MediaQuotaUsage = {
    id: createMediaQuotaId(userId, tenantId),
    userId,
    tenantId,
    totalBytes: 0,
    totalFiles: 0,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("media_usage_quotas")
    .insert({
      id: created.id,
      user_id: created.userId,
      tenant_id: created.tenantId,
      total_bytes: created.totalBytes,
      total_files: created.totalFiles,
      metadata_json: created.metadata,
      created_at: created.createdAt,
      updated_at: created.updatedAt,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return fromQuotaRow(inserted as MediaQuotaUsageRow);
}

export async function updateMediaQuotaDelta(input: {
  userId: string;
  tenantId: string;
  bytesDelta: number;
  filesDelta: number;
  reason: "upload" | "delete";
}): Promise<MediaQuotaUsage> {
  const existing = await getOrCreateMediaQuota(input.userId, input.tenantId);
  const supabase = getSupabaseServiceClient();

  const nextTotalBytes = Math.max(0, existing.totalBytes + input.bytesDelta);
  const nextTotalFiles = Math.max(0, existing.totalFiles + input.filesDelta);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("media_usage_quotas")
    .update({
      total_bytes: nextTotalBytes,
      total_files: nextTotalFiles,
      last_upload_at: input.reason === "upload" ? now : existing.lastUploadAt ?? null,
      last_delete_at: input.reason === "delete" ? now : existing.lastDeleteAt ?? null,
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) throw error;
  return fromQuotaRow(data as MediaQuotaUsageRow);
}

export function createNewMediaAsset(input: {
  userId: string;
  tenantId: string;
  provider: MediaAsset["provider"];
  bucket: string;
  objectKey: string;
  mediaType: MediaAsset["mediaType"];
  mimeType: string;
  originalFilename: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  linkedContentId?: string;
  linkedContentType?: string;
  metadata?: Record<string, unknown>;
  id?: string;
}): MediaAsset {
  const now = new Date().toISOString();
  return {
    id: input.id ?? createMediaId(),
    userId: input.userId,
    tenantId: input.tenantId,
    provider: input.provider,
    bucket: input.bucket,
    objectKey: input.objectKey,
    mediaType: input.mediaType,
    mimeType: input.mimeType,
    originalFilename: input.originalFilename,
    fileSizeBytes: input.fileSizeBytes,
    width: input.width,
    height: input.height,
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
    usageMetadata: {},
    metadata: input.metadata ?? {},
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function createUsageLink(input: {
  mediaId: string;
  userId: string;
  tenantId: string;
  contentId?: string;
  contentType?: string;
  usageContext: MediaUsageLink["usageContext"];
}): MediaUsageLink {
  return {
    id: createMediaUsageLinkId(input.mediaId),
    mediaId: input.mediaId,
    userId: input.userId,
    tenantId: input.tenantId,
    contentId: input.contentId,
    contentType: input.contentType,
    usageContext: input.usageContext,
    createdAt: new Date().toISOString(),
  };
}
