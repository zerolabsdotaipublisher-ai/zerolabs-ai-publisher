import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import type { WebsiteNavigation, WebsiteNavigationRow } from "./types";

interface StoreNavigationParams {
  structureId: string;
  userId: string;
  navigation: WebsiteNavigation;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function toRow(params: StoreNavigationParams): WebsiteNavigationRow {
  return {
    id: `${params.structureId}:v${params.version}`,
    structure_id: params.structureId,
    user_id: params.userId,
    hierarchy_json: params.navigation.hierarchy,
    navigation_json: params.navigation,
    version: params.version,
    created_at: params.createdAt,
    updated_at: params.updatedAt,
  };
}

export async function storeWebsiteNavigation(
  params: StoreNavigationParams,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const row = toRow(params);

  const { error } = await supabase
    .from("website_navigation")
    .upsert(row, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store website navigation", {
      category: "error",
      service: "supabase",
      structureId: params.structureId,
      error: { message: error.message, name: "SupabaseNavigationError" },
    });
    throw error;
  }
}

export async function getWebsiteNavigation(
  structureId: string,
  userId: string,
): Promise<WebsiteNavigation | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("website_navigation")
    .select("navigation_json")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    logger.error("Failed to fetch website navigation", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: { message: error.message, name: "SupabaseNavigationError" },
    });
    throw error;
  }

  return (data?.navigation_json as WebsiteNavigation) ?? null;
}
