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
// Constraint marker persisted by blog/article mappings when publish scheduling metadata exists.
// Example: blog_scheduled_publish_at:<ISO timestamp>.
const SCHEDULED_CONSTRAINT_MARKER = "_scheduled_publish_at:";
type ContentLifecycleStatus =
  | "draft"
  | "generated"
  | "edited"
  | "scheduled"
  | "published"
  | "archived"
  | "deleted";
type ContentScheduleState = "none" | "active" | "paused" | "running" | "completed" | "failed" | "cancelled";
type ContentType = "website" | "blog" | "article";

interface StoreWebsiteGeneratedContentOptions {
  contentStatus?: ContentLifecycleStatus;
  contentType?: ContentType;
  scheduleState?: ContentScheduleState;
}

function generateRowId(structureId: string, pageSlug: string, sectionKey: string): string {
  const normalizedSlug = pageSlug.trim();
  const slug = normalizedSlug
    ? Buffer.from(normalizedSlug, "utf8").toString("base64url")
    : ROOT_PAGE_SLUG_KEY;
  return `${structureId}:${slug}:${sectionKey}`;
}

function inferContentStatus(content: WebsiteContentPackage): ContentLifecycleStatus {
  const constraints = Array.isArray(content.generatedFromInput.constraints)
    ? content.generatedFromInput.constraints
    : [];

  if (constraints.some((constraint) => constraint.includes(SCHEDULED_CONSTRAINT_MARKER))) {
    return "scheduled";
  }

  return content.version > 1 ? "edited" : "generated";
}

function inferContentType(content: WebsiteContentPackage): ContentType {
  if (content.websiteType === "blog" || content.websiteType === "article") {
    return content.websiteType;
  }
  return "website";
}

function validateWebsiteContentPackage(content: WebsiteContentPackage): void {
  if (!content.structureId.trim() || !content.userId.trim()) {
    throw new Error("Generated content requires structureId and userId.");
  }

  if (!Array.isArray(content.pages) || content.pages.length === 0) {
    throw new Error("Generated content must contain at least one page.");
  }

  const seen = new Set<string>();
  for (const page of content.pages) {
    const slug = page.pageSlug.trim();
    if (!slug) {
      throw new Error("Generated content pages require a non-empty pageSlug.");
    }

    const pageKey = `${slug}:__page__`;
    if (seen.has(pageKey)) {
      throw new Error(`Duplicate generated content page entry for slug '${slug}'.`);
    }
    seen.add(pageKey);

    for (const sectionKey of Object.keys(page.sections)) {
      if (!sectionKey.trim()) {
        throw new Error(`Generated content section key cannot be empty for slug '${slug}'.`);
      }
      const composite = `${slug}:${sectionKey}`;
      if (seen.has(composite)) {
        throw new Error(`Duplicate generated content section '${sectionKey}' for slug '${slug}'.`);
      }
      seen.add(composite);
    }
  }
}

function serializePageRows(
  content: WebsiteContentPackage,
  options?: StoreWebsiteGeneratedContentOptions,
): WebsiteGeneratedContentRow[] {
  const rows: WebsiteGeneratedContentRow[] = [];
  const contentStatus = options?.contentStatus ?? inferContentStatus(content);
  const contentType = options?.contentType ?? inferContentType(content);
  const scheduleState = options?.scheduleState ?? "none";

  content.pages.forEach((page: GeneratedPageContent) => {
    rows.push({
      id: generateRowId(content.structureId, page.pageSlug, "__page__"),
      structure_id: content.structureId,
      user_id: content.userId,
      content_type: contentType,
      content_status: contentStatus,
      schedule_state: scheduleState,
      page_slug: page.pageSlug,
      section_key: "__page__",
      content_json: page.messaging,
      generated_from_input: content.generatedFromInput,
      version: content.version,
      created_by: content.userId,
      updated_by: content.userId,
      is_archived: false,
      archived_at: null,
      deleted_at: null,
      created_at: content.generatedAt,
      updated_at: content.updatedAt,
    });

    Object.entries(page.sections).forEach(([sectionKey, sectionContent]) => {
      rows.push({
        id: generateRowId(content.structureId, page.pageSlug, sectionKey),
        structure_id: content.structureId,
        user_id: content.userId,
        content_type: contentType,
        content_status: contentStatus,
        schedule_state: scheduleState,
        page_slug: page.pageSlug,
        section_key: sectionKey,
        content_json: sectionContent,
        generated_from_input: content.generatedFromInput,
        version: content.version,
        created_by: content.userId,
        updated_by: content.userId,
        is_archived: false,
        archived_at: null,
        deleted_at: null,
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
  const resolvePageSubheadline = (
    page: WebsiteStructure["pages"][number],
  ): string | undefined => {
    for (const section of page.sections) {
      const subheadline = section.content["subheadline"];
      if (typeof subheadline === "string" && subheadline.trim()) {
        return subheadline;
      }
    }
    return undefined;
  };

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
        pageSubheadline: resolvePageSubheadline(page),
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

function inferPageTypeFromSlug(slug: string): GeneratedPageContent["pageType"] {
  if (slug === "/") return "home";
  if (slug === "/about") return "about";
  if (slug === "/services" || slug === "/features" || slug === "/pricing") return "services";
  if (slug === "/contact") return "contact";
  return "custom";
}

export async function storeWebsiteGeneratedContent(
  content: WebsiteContentPackage,
  options?: StoreWebsiteGeneratedContentOptions,
): Promise<WebsiteContentPackage> {
  const supabase = getSupabaseServiceClient();
  validateWebsiteContentPackage(content);
  const rows = serializePageRows(content, options);

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
  return storeWebsiteGeneratedContent(content, {
    contentType: inferContentType(content),
    contentStatus: structure.version > 1 ? "edited" : "generated",
  });
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
    .is("deleted_at", null)
    .eq("is_archived", false)
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
        pageType: inferPageTypeFromSlug(row.page_slug),
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
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("website_generated_content")
    .update({
      content_status: "deleted",
      is_archived: true,
      archived_at: now,
      deleted_at: now,
      updated_by: userId,
      updated_at: now,
    })
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .is("deleted_at", null);

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
