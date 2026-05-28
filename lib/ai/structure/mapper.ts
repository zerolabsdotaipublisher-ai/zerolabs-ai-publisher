/**
 * AI output → WebsiteStructure mapper.
 *
 * Transforms a `WebsiteGenerationOutput` (the prompt output contract from
 * Story 3-1) into a fully-typed `WebsiteStructure` ready for storage and
 * rendering.  All IDs are generated here so callers receive a complete object.
 */

import type {
  PageDesignConfig,
  WebsiteGenerationInput,
  WebsiteGenerationOutput,
  WebsiteSectionName,
} from "../prompts/types";
import { createDefaultPageSeeds } from "../navigation/defaults";
import type { NavigationPageSeed } from "../navigation/types";
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

function cloneSection(section: WebsiteSection): WebsiteSection {
  return {
    ...section,
    content: structuredClone(section.content),
    components: section.components ? structuredClone(section.components) : undefined,
    styleHints: section.styleHints ? { ...section.styleHints } : undefined,
  };
}

function slugifyPageName(name: string, index: number): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (!normalized || normalized === "home" || index === 0) {
    return "/";
  }

  return `/${normalized}`;
}

function inferPageTypeFromDesign(page: PageDesignConfig, index: number): WebsitePage["type"] {
  const normalizedName = page.name.trim().toLowerCase();

  if (normalizedName === "home" || index === 0) {
    return "home";
  }
  if (normalizedName === "about" || page.layout === "about-story") {
    return "about";
  }
  if (normalizedName === "contact" || page.layout === "contact-info") {
    return "contact";
  }
  if (
    normalizedName === "services" ||
    normalizedName === "portfolio" ||
    page.layout === "service-business" ||
    page.layout === "portfolio-layout" ||
    page.layout === "product-showcase" ||
    page.layout === "grid-gallery"
  ) {
    return "services";
  }

  return "custom";
}

function createPageSeedsFromDesign(
  pages: PageDesignConfig[],
): NavigationPageSeed[] {
  return pages.map((page, index) => {
    const pageType = inferPageTypeFromDesign(page, index);
    const slug = slugifyPageName(page.name, index);

    return {
      id: page.id,
      title: page.name,
      slug,
      type: pageType,
      order: index,
      visible: true,
      parentPageId: null,
      priority: index * 10,
      includeInNavigation: true,
      navigationLabel: page.name,
    };
  });
}

function resolvePageSeeds(sourceInput: WebsiteGenerationInput): NavigationPageSeed[] {
  const configuredPages = sourceInput.designConfig?.pages;

  if (configuredPages?.length) {
    return createPageSeedsFromDesign(configuredPages);
  }

  return createDefaultPageSeeds(sourceInput.websiteType);
}

function resolveSectionTypesForPage(
  seed: NavigationPageSeed,
  pageDesign: PageDesignConfig | undefined,
): SectionType[] {
  if (pageDesign?.layout === "contact-info" || seed.type === "contact") {
    return ["hero", "contact", "cta", "footer"];
  }

  if (pageDesign?.layout === "about-story" || seed.type === "about") {
    return ["hero", "about", "testimonials", "cta", "footer"];
  }

  if (
    pageDesign?.layout === "blog-content" ||
    pageDesign?.layout === "portfolio-layout" ||
    pageDesign?.layout === "grid-gallery" ||
    pageDesign?.layout === "product-showcase" ||
    pageDesign?.layout === "service-business" ||
    seed.type === "services"
  ) {
    return ["hero", "services", "testimonials", "cta", "contact", "footer"];
  }

  return ["hero", "about", "services", "testimonials", "cta", "contact", "footer"];
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
  const pageSeeds = resolvePageSeeds(sourceInput);
  const pageSeedById = new Map(pageSeeds.map((seed) => [seed.id, seed]));
  const pageDesignById = new Map(
    sourceInput.designConfig?.pages?.map((page) => [page.id, page]) ?? [],
  );

  const resolveSeedDepth = (
    seedId: string,
    seen = new Set<string>(),
  ): number => {
    const seed = pageSeedById.get(seedId);
    if (!seed?.parentPageId) return 0;
    if (seen.has(seedId)) return 0;
    const parent = pageSeedById.get(seed.parentPageId);
    if (!parent) return 0;
    seen.add(seedId);
    return 1 + resolveSeedDepth(parent.id, seen);
  };

  const pages: WebsitePage[] = pageSeeds.map((seed, pageIndex) => {
    const pageDesign = pageDesignById.get(seed.id);
    const sectionTypes = resolveSectionTypesForPage(seed, pageDesign);
    const selectedSections = sectionTypes
      .map((type) => sectionByType.get(type))
      .filter((section): section is WebsiteSection => Boolean(section))
      .map((section, sectionIndex) => ({
        ...cloneSection(section),
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
              ...cloneSection(section),
              id: generateId(`sec_${seed.type}_${section.type}`),
              order: sectionIndex,
            })),
      seo: generatePageSeo(output, seed.type),
      order: pageIndex,
      parentPageId: seed.parentPageId ?? null,
      depth: resolveSeedDepth(seed.id),
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
