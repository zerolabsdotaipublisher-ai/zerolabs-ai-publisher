import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  GeneratedPageContent,
  WebsiteContentPackage,
  WebsiteGeneratedContentRow,
} from "./types";

// Base64url-encoded fallback key for the root page slug when no slug is present.
const ROOT_PAGE_SLUG_KEY = "cm9vdA";

function generateRowId(structureId: string, pageSlug: string, sectionKey: string): string {
  const normalizedSlug = pageSlug.trim();
  const slug = normalizedSlug
    ? Buffer.from(normalizedSlug, "utf8").toString("base64url")
    : ROOT_PAGE_SLUG_KEY;
  return `${structureId}:${slug}:${sectionKey}`;
}

function serializePageRows(content: WebsiteContentPackage): WebsiteGeneratedContentRow[] {
  const rows: WebsiteGeneratedContentRow[] = [];

  content.pages.forEach((page: GeneratedPageContent) => {
    rows.push({
      id: generateRowId(content.structureId, page.pageSlug, "__page__"),
      structure_id: content.structureId,
      user_id: content.userId,
      page_slug: page.pageSlug,
      section_key: "__page__",
      content_json: page.messaging,
      generated_from_input: content.generatedFromInput,
      version: content.version,
      created_at: content.generatedAt,
      updated_at: content.updatedAt,
    });

    Object.entries(page.sections).forEach(([sectionKey, sectionContent]) => {
      rows.push({
        id: generateRowId(content.structureId, page.pageSlug, sectionKey),
        structure_id: content.structureId,
        user_id: content.userId,
        page_slug: page.pageSlug,
        section_key: sectionKey,
        content_json: sectionContent,
        generated_from_input: content.generatedFromInput,
        version: content.version,
        created_at: content.generatedAt,
        updated_at: content.updatedAt,
      });
    });
  });

  return rows;
}

export async function storeWebsiteGeneratedContent(
  content: WebsiteContentPackage,
): Promise<WebsiteContentPackage> {
  const supabase = getSupabaseServiceClient();
  const rows = serializePageRows(content);

  const { error } = await supabase
    .from("website_generated_content")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store generated website content", {
      category: "error",
      service: "supabase",
      structureId: content.structureId,
      error: { message: error.message, name: "SupabaseGeneratedContentError" },
    });
    throw error;
  }

  return content;
}

export async function deleteWebsiteGeneratedContent(
  structureId: string,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("website_generated_content")
    .delete()
    .eq("structure_id", structureId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to delete generated website content", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: { message: error.message, name: "SupabaseGeneratedContentError" },
    });
    throw error;
  }
}
