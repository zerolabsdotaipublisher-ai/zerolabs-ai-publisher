import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import { fromAiAssetRow } from "@/lib/ai-assets/model";
import type { AiAssetRow } from "@/lib/ai-assets/types";
import { createWebsiteMediaLibraryItemId, fromWebsiteMediaLibraryItemRow, fromWebsiteMediaLibraryUsageRow, toWebsiteMediaLibraryItemRow, toWebsiteMediaLibraryUsageRow } from "./model";
import type { WebsiteMediaLibraryItem, WebsiteMediaLibraryItemRow, WebsiteMediaLibraryListQuery, WebsiteMediaLibraryListResult, WebsiteMediaLibraryUpsertInput, WebsiteMediaLibraryUsageRecord, WebsiteMediaLibraryUsageRow } from "./types";

export async function getOwnedWebsiteMediaLibraryItem(userId: string, itemId: string, includeDeleted = false): Promise<WebsiteMediaLibraryItem | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("website_media_library_items").select("*").eq("id", itemId).eq("user_id", userId);
  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromWebsiteMediaLibraryItemRow(data as WebsiteMediaLibraryItemRow) : null;
}

export async function createOrUpdateWebsiteMediaLibraryItem(input: WebsiteMediaLibraryUpsertInput): Promise<WebsiteMediaLibraryItem> {
  const existing = await getOwnedWebsiteMediaLibraryItemByMediaId(input.userId, input.tenantId, input.mediaId, true);
  const now = new Date().toISOString();
  const next: WebsiteMediaLibraryItem = existing
    ? {
        ...existing,
        websiteId: input.websiteId ?? existing.websiteId,
        aiAssetId: input.aiAssetId ?? existing.aiAssetId,
        displayName: input.displayName,
        description: input.description ?? existing.description,
        altText: input.altText ?? existing.altText,
        mediaType: input.mediaType,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        width: input.width ?? existing.width,
        height: input.height ?? existing.height,
        tags: input.tags ?? existing.tags,
        usageSummary: input.usageSummary ?? existing.usageSummary,
        associationSummary: input.associationSummary ?? existing.associationSummary,
        metadata: {
          ...existing.metadata,
          ...(input.metadata ?? {}),
        },
        archivedAt: existing.deletedAt ? undefined : existing.archivedAt,
        deletedAt: undefined,
        updatedAt: now,
      }
    : {
        id: createWebsiteMediaLibraryItemId(),
        userId: input.userId,
        tenantId: input.tenantId,
        websiteId: input.websiteId,
        mediaId: input.mediaId,
        aiAssetId: input.aiAssetId,
        displayName: input.displayName,
        description: input.description,
        altText: input.altText,
        mediaType: input.mediaType,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        width: input.width,
        height: input.height,
        tags: input.tags ?? [],
        usageCount: 0,
        usageSummary: input.usageSummary ?? {},
        associationSummary: input.associationSummary ?? {},
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now,
      };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_media_library_items")
    .upsert(toWebsiteMediaLibraryItemRow(next), { onConflict: "user_id,tenant_id,media_id" })
    .select("*")
    .single();

  if (error) throw error;
  return fromWebsiteMediaLibraryItemRow(data as WebsiteMediaLibraryItemRow);
}

export async function getOwnedWebsiteMediaLibraryItemByMediaId(userId: string, tenantId: string, mediaId: string, includeDeleted = false): Promise<WebsiteMediaLibraryItem | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("website_media_library_items")
    .select("*")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("media_id", mediaId);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromWebsiteMediaLibraryItemRow(data as WebsiteMediaLibraryItemRow) : null;
}

export async function listOwnedWebsiteMediaLibraryItems(userId: string, tenantId: string, query: WebsiteMediaLibraryListQuery): Promise<WebsiteMediaLibraryListResult> {
  const supabase = getSupabaseServiceClient();
  let base = supabase
    .from("website_media_library_items")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("tenant_id", tenantId);

  if (!query.includeDeleted && query.status !== "deleted") {
    base = base.is("deleted_at", null);
  }
  if (query.status === "archived") {
    base = base.not("archived_at", "is", null).is("deleted_at", null);
  }
  if (query.status === "active") {
    base = base.is("archived_at", null).is("deleted_at", null);
  }
  if (query.status === "deleted") {
    base = base.not("deleted_at", "is", null);
  }
  if (query.mediaType) {
    base = base.eq("media_type", query.mediaType);
  }
  if (query.websiteId) {
    base = base.eq("website_id", query.websiteId);
  }
  if (query.tag) {
    base = base.contains("tags", [query.tag.toLowerCase()]);
  }
  if (query.linkedContentId) {
    base = base.contains("association_summary_json", { linkedContentId: query.linkedContentId });
  }
  if (query.linkedContentType) {
    base = base.contains("association_summary_json", { linkedContentType: query.linkedContentType });
  }
  if (query.search) {
    base = base.or(`display_name.ilike.%${query.search}%,description.ilike.%${query.search}%,alt_text.ilike.%${query.search}%`);
  }

  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;
  const { data, count, error } = await base.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const items = ((data ?? []) as WebsiteMediaLibraryItemRow[]).map(fromWebsiteMediaLibraryItemRow);
  const total = count ?? items.length;
  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    hasMore: from + items.length < total,
  };
}

export async function updateWebsiteMediaLibraryItem(item: WebsiteMediaLibraryItem): Promise<WebsiteMediaLibraryItem> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_media_library_items")
    .update(toWebsiteMediaLibraryItemRow(item))
    .eq("id", item.id)
    .eq("user_id", item.userId)
    .select("*")
    .single();

  if (error) throw error;
  return fromWebsiteMediaLibraryItemRow(data as WebsiteMediaLibraryItemRow);
}

export async function softDeleteWebsiteMediaLibraryItem(item: WebsiteMediaLibraryItem, mode: "archive" | "delete"): Promise<WebsiteMediaLibraryItem> {
  const now = new Date().toISOString();
  return updateWebsiteMediaLibraryItem({
    ...item,
    archivedAt: mode === "archive" ? item.archivedAt ?? now : item.archivedAt,
    deletedAt: mode === "delete" ? now : undefined,
    updatedAt: now,
  });
}

export async function restoreWebsiteMediaLibraryItem(item: WebsiteMediaLibraryItem): Promise<WebsiteMediaLibraryItem> {
  return updateWebsiteMediaLibraryItem({
    ...item,
    archivedAt: undefined,
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function saveWebsiteMediaLibraryUsage(record: WebsiteMediaLibraryUsageRecord): Promise<WebsiteMediaLibraryUsageRecord> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_media_library_usage")
    .upsert(toWebsiteMediaLibraryUsageRow(record), {
      onConflict: "library_item_id,website_id,content_id,content_type,page_id,section_id,usage_kind",
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromWebsiteMediaLibraryUsageRow(data as WebsiteMediaLibraryUsageRow);
}

export async function listWebsiteMediaLibraryUsage(itemId: string, userId: string): Promise<WebsiteMediaLibraryUsageRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_media_library_usage")
    .select("*")
    .eq("library_item_id", itemId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as WebsiteMediaLibraryUsageRow[]).map(fromWebsiteMediaLibraryUsageRow);
}

export async function listOwnedAiAssetLibraryCandidates(userId: string, tenantId: string): Promise<Array<{ aiAssetId: string; mediaId: string; websiteId?: string; displayName: string; description?: string; altText?: string; tags: string[]; metadata: Record<string, unknown>; }>> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_assets")
    .select("*")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as AiAssetRow[];
  const candidates = [] as Array<{ aiAssetId: string; mediaId: string; websiteId?: string; displayName: string; description?: string; altText?: string; tags: string[]; metadata: Record<string, unknown>; }>;

  for (const row of rows) {
    const asset = fromAiAssetRow(row);
    const media = await getOwnedMediaAsset(userId, asset.mediaId);
    if (!media) continue;
    candidates.push({
      aiAssetId: asset.id,
      mediaId: asset.mediaId,
      websiteId: typeof asset.generationTarget.websiteId === "string" ? asset.generationTarget.websiteId : undefined,
      displayName: media.originalFilename,
      description: asset.promptText,
      altText: typeof asset.contextMetadata.altText === "string" ? asset.contextMetadata.altText : undefined,
      tags: [asset.assetType, asset.assetPurpose, asset.generationProvider, asset.generationModel].filter((entry): entry is string => Boolean(entry)),
      metadata: {
        assetType: asset.assetType,
        assetPurpose: asset.assetPurpose,
        sourceWorkflow: asset.sourceWorkflow,
        generationProvider: asset.generationProvider,
        generationModel: asset.generationModel,
      },
    });
  }

  return candidates;
}
