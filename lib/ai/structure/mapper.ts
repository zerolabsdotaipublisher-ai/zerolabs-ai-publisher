/**
 * AI output → WebsiteStructure mapper.
 *
 * Transforms a `WebsiteGenerationOutput` (the prompt output contract from
 * Story 3-1) into a fully-typed `WebsiteStructure` ready for storage and
 * rendering.  All IDs are generated here so callers receive a complete object.
 */

import type {
  WebsiteGenerationInput,
  WebsiteGenerationOutput,
  WebsiteSectionName,
} from "../prompts/types";
import type {
  WebsiteStructure,
  WebsitePage,
  WebsiteSection,
  SectionType,
} from "./types";
import { generateNavigation } from "./navigation";
import { generateSiteSeo, generatePageSeo } from "./metadata";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a collision-resistant string ID with a readable prefix.
 * Not a UUID — intended for app-internal use where human-readable IDs help
 * with debugging.
 */
function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rnd}`;
}

// ---------------------------------------------------------------------------
// Section extraction
// ---------------------------------------------------------------------------

/** Ordered set of section names that the mapper processes. */
const SECTION_ORDER: WebsiteSectionName[] = [
  "hero",
  "about",
  "services",
  "testimonials",
  "cta",
  "contact",
  "footer",
];

/**
 * Extract the content record for a given section name from the AI output.
 * Returns null when the section is absent from the output.
 */
function extractSectionContent(
  name: WebsiteSectionName,
  output: WebsiteGenerationOutput,
): Record<string, unknown> | null {
  switch (name) {
    case "hero":
      return output.sections.hero
        ? (output.sections.hero as unknown as Record<string, unknown>)
        : null;
    case "about":
      return output.sections.about
        ? (output.sections.about as unknown as Record<string, unknown>)
        : null;
    case "services":
      return output.sections.services
        ? (output.sections.services as unknown as Record<string, unknown>)
        : null;
    case "testimonials":
      return output.sections.testimonials
        ? (output.sections.testimonials as unknown as Record<string, unknown>)
        : null;
    case "cta":
      return output.sections.cta
        ? (output.sections.cta as unknown as Record<string, unknown>)
        : null;
    case "contact":
      return output.sections.contact
        ? (output.sections.contact as unknown as Record<string, unknown>)
        : null;
    case "footer":
      return output.sections.footer
        ? (output.sections.footer as unknown as Record<string, unknown>)
        : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public mapper
// ---------------------------------------------------------------------------

/**
 * Map a `WebsiteGenerationOutput` to a fully-typed `WebsiteStructure`.
 *
 * @param output      - AI output (after fallbacks have been applied).
 * @param userId      - Authenticated user ID for ownership.
 * @param sourceInput - Original generation input stored alongside the structure.
 * @param id          - Pre-generated stable ID for the structure.
 * @param now         - ISO 8601 timestamp for generatedAt / updatedAt.
 */
export function mapOutputToStructure(
  output: WebsiteGenerationOutput,
  userId: string,
  sourceInput: WebsiteGenerationInput,
  id: string,
  now: string,
): WebsiteStructure {
  // Build sections in canonical order, skipping absent ones.
  const sections: WebsiteSection[] = [];
  let order = 0;

  for (const name of SECTION_ORDER) {
    const content = extractSectionContent(name, output);
    if (content !== null) {
      sections.push({
        id: generateId(`sec_${name}`),
        type: name as SectionType,
        order: order++,
        visible: true,
        content,
      });
    }
  }

  const page: WebsitePage = {
    id: generateId("page_home"),
    slug: "/",
    title: "Home",
    type: "home",
    sections,
    seo: generatePageSeo(output, "home"),
    order: 0,
  };

  const navigation = generateNavigation(
    output.websiteType,
    sections,
    output.siteTitle,
    new Date(now).getFullYear(),
  );

  return {
    id,
    userId,
    websiteType: output.websiteType,
    siteTitle: output.siteTitle,
    tagline: output.tagline,
    pages: [page],
    navigation,
    seo: generateSiteSeo(output),
    styleConfig: {
      tone: output.styleHints.tone,
      style: output.styleHints.style,
      colorMood: output.styleHints.colorMood,
      typographyMood: output.styleHints.typographyMood,
    },
    sourceInput,
    status: "draft",
    version: 1,
    generatedAt: now,
    updatedAt: now,
  };
}
