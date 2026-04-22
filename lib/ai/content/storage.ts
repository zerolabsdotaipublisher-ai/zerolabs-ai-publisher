import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { DEFAULT_DENSITY_PRESET, DEFAULT_LENGTH_PRESET } from "./schemas";
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

function toStructuredContentPackage(
  structure: WebsiteStructure,
  userId: string,
): WebsiteContentPackage {
  const now = new Date().toISOString();
  const generatedFromInput = structure.sourceInput as WebsiteGenerationInput;

  return {
    id: `wc_${structure.id}_${structure.version}`,
    structureId: structure.id,
    userId,
    websiteType: structure.websiteType,
    tone: structure.styleConfig.tone,
    style: structure.styleConfig.style,
    lengthPreset: DEFAULT_LENGTH_PRESET,
    densityPreset: DEFAULT_DENSITY_PRESET,
    pages: structure.pages.map((page) => ({
      pageSlug: page.slug,
      pageType: page.type,
      messaging: {
        pageHeadline: page.title,
        pageSubheadline:
          typeof page.sections[0]?.content?.["subheadline"] === "string"
            ? (page.sections[0].content["subheadline"] as string)
            : undefined,
        valueProposition: page.seo.description,
      },
      sections: Object.fromEntries(
        page.sections
          .filter((section) => section.type !== "custom")
          .map((section) => [section.type, section.content]),
      ),
    })),
    generatedFromInput,
    generatedAt: structure.generatedAt || now,
    updatedAt: structure.updatedAt || now,
    version: structure.version,
  };
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

export async function storeWebsiteStructureContentSnapshot(
  structure: WebsiteStructure,
  userId: string,
): Promise<WebsiteContentPackage> {
  const content = toStructuredContentPackage(structure, userId);
  return storeWebsiteGeneratedContent(content);
}

export async function getWebsiteGeneratedContent(
  structureId: string,
  userId: string,
): Promise<WebsiteContentPackage | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_generated_content")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .order("page_slug", { ascending: true })
    .order("section_key", { ascending: true });

  if (error) {
    logger.error("Failed to fetch generated website content", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: { message: error.message, name: "SupabaseGeneratedContentReadError" },
    });
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const rows = data as WebsiteGeneratedContentRow[];
  const first = rows[0];
  const generatedFromInput = (first.generated_from_input ?? {}) as WebsiteGenerationInput;
  const pageMap = new Map<string, GeneratedPageContent>();

  rows.forEach((row) => {
    const page =
      pageMap.get(row.page_slug) ??
      ({
        pageSlug: row.page_slug,
        pageType: "custom",
        messaging: {
          pageHeadline: row.page_slug === "/" ? "Home" : row.page_slug,
          valueProposition: "",
        },
        sections: {},
      } satisfies GeneratedPageContent);

    if (row.section_key === "__page__") {
      page.messaging = row.content_json as GeneratedPageContent["messaging"];
    } else {
      const sectionKey = row.section_key as keyof GeneratedPageContent["sections"];
      page.sections = {
        ...page.sections,
        [sectionKey]: row.content_json,
      } as GeneratedPageContent["sections"];
    }

    pageMap.set(row.page_slug, page);
  });

  return {
    id: first.id,
    structureId,
    userId,
    websiteType: generatedFromInput.websiteType || "small-business",
    tone: generatedFromInput.tone || "professional",
    style: generatedFromInput.style || "modern",
    lengthPreset: DEFAULT_LENGTH_PRESET,
    densityPreset: DEFAULT_DENSITY_PRESET,
    pages: Array.from(pageMap.values()),
    generatedFromInput,
    generatedAt: first.created_at,
    updatedAt: first.updated_at,
    version: first.version,
  };
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
