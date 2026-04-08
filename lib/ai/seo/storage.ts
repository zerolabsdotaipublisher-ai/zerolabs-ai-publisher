import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  GeneratedPageMetadata,
  GeneratedSiteMetadata,
  WebsiteSeoMetadataRow,
  WebsiteSeoPackage,
} from "./types";
import { SEO_METADATA_REQUIREMENTS } from "./requirements";

const SITE_ROW_SLUG = "__site__";

function generateRowId(structureId: string, pageSlug: string): string {
  const encoded = Buffer.from(pageSlug, "utf8").toString("base64url");
  return `${structureId}:${encoded}`;
}

function toRows(seo: WebsiteSeoPackage): WebsiteSeoMetadataRow[] {
  const rows: WebsiteSeoMetadataRow[] = [
    {
      id: generateRowId(seo.structureId, SITE_ROW_SLUG),
      structure_id: seo.structureId,
      user_id: seo.userId,
      page_slug: SITE_ROW_SLUG,
      metadata_json: seo.site,
      generated_from_input: seo.generatedFromInput,
      version: seo.version,
      created_at: seo.generatedAt,
      updated_at: seo.updatedAt,
    },
  ];

  seo.pages.forEach((page) => {
    rows.push({
      id: generateRowId(seo.structureId, page.pageSlug),
      structure_id: seo.structureId,
      user_id: seo.userId,
      page_slug: page.pageSlug,
      metadata_json: page,
      generated_from_input: seo.generatedFromInput,
      version: seo.version,
      created_at: seo.generatedAt,
      updated_at: seo.updatedAt,
    });
  });

  return rows;
}

function fromRows(rows: WebsiteSeoMetadataRow[]): WebsiteSeoPackage | null {
  const siteRow = rows.find((row) => row.page_slug === SITE_ROW_SLUG);
  if (!siteRow) return null;

  const generatedInput = siteRow.generated_from_input as Partial<
    WebsiteSeoPackage["generatedFromInput"]
  >;
  const websiteType =
    generatedInput.websiteType || SEO_METADATA_REQUIREMENTS.fallbackWebsiteType;

  const pages = rows
    .filter((row) => row.page_slug !== SITE_ROW_SLUG)
    .map((row) => row.metadata_json as GeneratedPageMetadata);

  return {
    id: `wseo_${siteRow.structure_id}_v${siteRow.version}`,
    structureId: siteRow.structure_id,
    userId: siteRow.user_id,
    websiteType,
    site: siteRow.metadata_json as GeneratedSiteMetadata,
    pages,
    generatedFromInput: generatedInput as WebsiteSeoPackage["generatedFromInput"],
    generatedAt: siteRow.created_at,
    updatedAt: siteRow.updated_at,
    version: siteRow.version,
  };
}

export async function storeWebsiteSeoMetadata(seo: WebsiteSeoPackage): Promise<WebsiteSeoPackage> {
  const supabase = getSupabaseServiceClient();
  const rows = toRows(seo);

  const { error } = await supabase.from("website_seo_metadata").upsert(rows, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store website SEO metadata", {
      category: "error",
      service: "supabase",
      structureId: seo.structureId,
      error: { message: error.message, name: "SupabaseWebsiteSeoError" },
    });
    throw error;
  }

  return seo;
}

export async function getWebsiteSeoMetadata(
  structureId: string,
  userId: string,
): Promise<WebsiteSeoPackage | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("website_seo_metadata")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .order("version", { ascending: false });

  if (error) {
    logger.error("Failed to fetch website SEO metadata", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: { message: error.message, name: "SupabaseWebsiteSeoError" },
    });
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const latestVersion = data[0]?.version;
  const latestRows = (data as WebsiteSeoMetadataRow[]).filter(
    (row) => row.version === latestVersion,
  );

  return fromRows(latestRows);
}
