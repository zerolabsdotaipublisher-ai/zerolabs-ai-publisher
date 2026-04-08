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
import { createDefaultPageSeeds } from "../navigation/defaults";
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
  const homeSections: WebsiteSection[] = [];
  let order = 0;

  for (const name of SECTION_ORDER) {
    const content = extractSectionContent(name, output);
    if (content !== null) {
      homeSections.push({
        id: generateId(`sec_${name}`),
        type: name as SectionType,
        order: order++,
        visible: true,
        content,
      });
    }
  }

  const sectionByType = new Map(homeSections.map((section) => [section.type, section]));
  const pageSeeds = createDefaultPageSeeds(output.websiteType);

  const sectionTypesByPageType: Record<WebsitePage["type"], SectionType[]> = {
    home: ["hero", "about", "services", "testimonials", "cta", "contact", "footer"],
    about: ["hero", "about", "testimonials", "cta", "footer"],
    services: ["hero", "services", "testimonials", "cta", "contact", "footer"],
    contact: ["hero", "contact", "cta", "footer"],
    custom: ["hero", "services", "cta", "footer"],
  };

  const pages: WebsitePage[] = pageSeeds.map((seed, pageIndex) => {
    const sectionTypes = sectionTypesByPageType[seed.type] ?? sectionTypesByPageType.custom;
    const selectedSections = sectionTypes
      .map((type) => sectionByType.get(type))
      .filter((section): section is WebsiteSection => Boolean(section))
      .map((section, sectionIndex) => ({
        ...section,
        id: generateId(`sec_${seed.type}_${section.type}`),
        order: sectionIndex,
      }));

    return {
      id: seed.id || generateId(`page_${seed.type}`),
      slug: seed.slug,
      title: seed.title,
      type: seed.type,
      sections:
        selectedSections.length > 0
          ? selectedSections
          : homeSections.map((section, sectionIndex) => ({
              ...section,
              id: generateId(`sec_${seed.type}_${section.type}`),
              order: sectionIndex,
            })),
      seo: generatePageSeo(output, seed.type),
      order: pageIndex,
      parentPageId: seed.parentPageId ?? null,
      depth: seed.parentPageId ? 1 : 0,
      priority: seed.priority ?? pageIndex,
      visible: seed.visible,
      navigation: {
        includeInHeader: seed.includeInNavigation ?? true,
        includeInFooter: true,
        includeInSidebar: Boolean(seed.parentPageId),
      },
      navigationLabel: seed.navigationLabel ?? seed.title,
    };
  });

  const navigation = generateNavigation(
    output.websiteType,
    pages,
    output.siteTitle,
    new Date(now).getFullYear(),
  );

  return {
    id,
    userId,
    websiteType: output.websiteType,
    siteTitle: output.siteTitle,
    tagline: output.tagline,
    pages,
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
