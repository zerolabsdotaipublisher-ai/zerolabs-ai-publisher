import "server-only";

import { detectPublicationState } from "@/lib/publish";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getWebsiteStructureById } from "@/lib/ai/structure";
import { fromAiAssetRow } from "@/lib/ai-assets/model";
import type { AiAssetRow } from "@/lib/ai-assets/types";
import { fromMediaRow } from "@/lib/media/model";
import type { MediaAssetRow } from "@/lib/media/types";
import { fromWebsiteMediaLibraryItemRow } from "@/lib/website-media-library/model";
import type { WebsiteMediaLibraryItemRow, WebsiteMediaLibraryUsageRow } from "@/lib/website-media-library/types";
import { toWebsiteAssetAssociation } from "./model";
import { getCachedWebsiteAssetRecord, setCachedWebsiteAssetRecord } from "./cache";
import type { WebsiteAssetListResult, WebsiteAssetRecord, WebsiteAssetResolveQuery } from "./types";

async function hydrateWebsiteAssetRecords(rows: WebsiteMediaLibraryItemRow[]): Promise<WebsiteAssetRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabaseServiceClient();
  const mediaIds = Array.from(new Set(rows.map((row) => row.media_id)));
  const aiAssetIds = Array.from(new Set(rows.map((row) => row.ai_asset_id).filter((value): value is string => Boolean(value))));
  const websiteIds = Array.from(new Set(rows.map((row) => row.website_id).filter((value): value is string => Boolean(value))));

  const [{ data: mediaRows, error: mediaError }, { data: aiAssetRows, error: aiAssetError }] = await Promise.all([
    supabase.from("media_assets").select("*").in("id", mediaIds),
    aiAssetIds.length > 0
      ? supabase.from("ai_assets").select("*").in("id", aiAssetIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (mediaError) throw mediaError;
  if (aiAssetError) throw aiAssetError;

  const mediaMap = new Map(((mediaRows ?? []) as MediaAssetRow[]).map((row) => {
    const media = fromMediaRow(row);
    return [media.id, media] as const;
  }));

  const aiAssetMap = new Map(((aiAssetRows ?? []) as AiAssetRow[]).map((row) => {
    const asset = fromAiAssetRow(row);
    return [asset.id, asset] as const;
  }));

  const websiteEntries = await Promise.all(websiteIds.map(async (websiteId) => [websiteId, await getWebsiteStructureById(websiteId)] as const));
  const websiteMap = new Map(websiteEntries);

  return rows.map((row) => {
    const item = fromWebsiteMediaLibraryItemRow(row);
    const media = mediaMap.get(item.mediaId);
    const aiAsset = item.aiAssetId ? aiAssetMap.get(item.aiAssetId) : undefined;
    const website = item.websiteId ? websiteMap.get(item.websiteId) ?? null : null;
    const record: WebsiteAssetRecord = {
      id: item.id,
      libraryItem: item,
      media,
      aiAsset,
      website,
      publicationState: website ? detectPublicationState(website).state : undefined,
      association: toWebsiteAssetAssociation(item.associationSummary),
      status: media
        ? item.deletedAt
          ? "deleted"
          : item.archivedAt
            ? "archived"
            : "active"
        : "missing",
    };

    setCachedWebsiteAssetRecord(record.id, record);
    return record;
  });
}

async function getWebsiteAssetRowsByIds(ids: string[]): Promise<WebsiteMediaLibraryItemRow[]> {
  if (ids.length === 0) {
    return [];
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_media_library_items")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WebsiteMediaLibraryItemRow[];
}

export async function getWebsiteAssetRecordById(assetId: string): Promise<WebsiteAssetRecord | null> {
  const cached = getCachedWebsiteAssetRecord(assetId);
  if (cached) {
    return cached;
  }

  const rows = await getWebsiteAssetRowsByIds([assetId]);
  const records = await hydrateWebsiteAssetRecords(rows);
  return records[0] ?? null;
}

async function listUsageScopedAssetIds(input: {
  userId: string;
  tenantId: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
}): Promise<string[] | undefined> {
  if (!input.contentId && !input.contentType && !input.pageId && !input.sectionId) {
    return undefined;
  }

  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("website_media_library_usage")
    .select("library_item_id")
    .eq("user_id", input.userId)
    .eq("tenant_id", input.tenantId);

  if (input.websiteId) {
    query = query.eq("website_id", input.websiteId);
  }
  if (input.contentId) {
    query = query.eq("content_id", input.contentId);
  }
  if (input.contentType) {
    query = query.eq("content_type", input.contentType);
  }
  if (input.pageId) {
    query = query.eq("page_id", input.pageId);
  }
  if (input.sectionId) {
    query = query.eq("section_id", input.sectionId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return Array.from(new Set(((data ?? []) as Pick<WebsiteMediaLibraryUsageRow, "library_item_id">[]).map((row) => row.library_item_id)));
}

export async function listWebsiteAssetRecords(query: WebsiteAssetResolveQuery & { userId: string; tenantId: string; }): Promise<WebsiteAssetListResult> {
  const supabase = getSupabaseServiceClient();
  const usageScopedIds = await listUsageScopedAssetIds(query);
  if (usageScopedIds && usageScopedIds.length === 0) {
    return { items: [], total: 0, page: query.page, perPage: query.perPage, hasMore: false };
  }

  let base = supabase
    .from("website_media_library_items")
    .select("*", { count: "exact" })
    .eq("user_id", query.userId)
    .eq("tenant_id", query.tenantId);

  if (!query.includeDeleted) {
    base = base.is("deleted_at", null);
  }
  if (!query.includeArchived) {
    base = base.is("archived_at", null);
  }
  if (query.assetId || query.libraryItemId) {
    base = base.eq("id", query.assetId ?? query.libraryItemId ?? "");
  }
  if (query.mediaId) {
    base = base.eq("media_id", query.mediaId);
  }
  if (query.aiAssetId) {
    base = base.eq("ai_asset_id", query.aiAssetId);
  }
  if (query.websiteId) {
    base = base.eq("website_id", query.websiteId);
  }
  if (usageScopedIds) {
    base = base.in("id", usageScopedIds);
  }
  if (query.search) {
    base = base.or(`display_name.ilike.%${query.search}%,description.ilike.%${query.search}%,alt_text.ilike.%${query.search}%`);
  }

  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;
  const { data, count, error } = await base.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const items = await hydrateWebsiteAssetRecords((data ?? []) as WebsiteMediaLibraryItemRow[]);
  const total = count ?? items.length;
  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    hasMore: from + items.length < total,
  };
}
