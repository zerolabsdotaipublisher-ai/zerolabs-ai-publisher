import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { fromAiAssetRow, toAiAssetRow } from "./model";
import type { AiAsset, AiAssetListQuery, AiAssetListResult, AiAssetRow } from "./types";

export async function createAiAssetRecord(asset: AiAsset): Promise<AiAsset> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("ai_assets").insert(toAiAssetRow(asset)).select("*").single();

  if (error) throw error;
  return fromAiAssetRow(data as AiAssetRow);
}

export async function updateAiAssetRecord(asset: AiAsset): Promise<AiAsset> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_assets")
    .update(toAiAssetRow(asset))
    .eq("id", asset.id)
    .eq("user_id", asset.userId)
    .select("*")
    .single();

  if (error) throw error;
  return fromAiAssetRow(data as AiAssetRow);
}

export async function getOwnedAiAsset(userId: string, assetId: string, includeDeleted = false): Promise<AiAsset | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("ai_assets").select("*").eq("id", assetId).eq("user_id", userId);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromAiAssetRow(data as AiAssetRow) : null;
}

export async function listOwnedAiAssets(userId: string, tenantId: string, query: AiAssetListQuery): Promise<AiAssetListResult> {
  const supabase = getSupabaseServiceClient();
  let base = supabase.from("ai_assets").select("*", { count: "exact" }).eq("user_id", userId).eq("tenant_id", tenantId);

  if (!query.includeDeleted) {
    base = base.is("deleted_at", null);
  }

  if (query.status) {
    base = base.eq("status", query.status);
  }

  if (query.assetType) {
    base = base.eq("asset_type", query.assetType);
  }

  if (query.linkedContentId) {
    base = base.eq("linked_content_id", query.linkedContentId);
  }

  if (query.linkedContentType) {
    base = base.eq("linked_content_type", query.linkedContentType);
  }

  if (query.originalAssetId) {
    base = base.eq("original_asset_id", query.originalAssetId);
  }

  if (query.search) {
    base = base.or(`prompt_text.ilike.%${query.search}%,source_workflow.ilike.%${query.search}%`);
  }

  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;
  const { data, count, error } = await base.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;

  const items = ((data ?? []) as AiAssetRow[]).map(fromAiAssetRow);
  const total = count ?? items.length;

  return {
    items,
    total,
    page: query.page,
    perPage: query.perPage,
    hasMore: from + items.length < total,
  };
}

export async function listOwnedAiAssetVariants(userId: string, tenantId: string, originalAssetId: string): Promise<AiAsset[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_assets")
    .select("*")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("original_asset_id", originalAssetId)
    .eq("is_variant", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as AiAssetRow[]).map(fromAiAssetRow);
}
