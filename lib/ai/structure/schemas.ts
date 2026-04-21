/**
 * Validation helpers for the website structure model.
 *
 * All validators are pure functions that return a list of error strings.
 * An empty list means the value is valid.  No external validation library is
 * used to keep dependencies minimal and consistent with the prompts schemas
 * module (lib/ai/prompts/schemas.ts).
 */

import type {
  WebsiteStructure,
  WebsitePage,
  WebsiteSeo,
  WebsiteStructureStatus,
  WebsiteType,
} from "./types";

// ---------------------------------------------------------------------------
// Supported value sets
// ---------------------------------------------------------------------------

export const SUPPORTED_STRUCTURE_STATUSES: WebsiteStructureStatus[] = [
  "draft",
  "published",
  "archived",
];

export const SUPPORTED_WEBSITE_TYPES_STRUCTURE: WebsiteType[] = [
  "portfolio",
  "small-business",
  "landing-page",
  "personal-brand",
  "blog",
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Page validation
// ---------------------------------------------------------------------------

function validatePage(page: Partial<WebsitePage>, index: number): string[] {
  const errors: string[] = [];
  const label = `pages[${index}]`;

  if (!isNonEmptyString(page.id)) {
    errors.push(`${label}.id is required`);
  }
  if (!isNonEmptyString(page.slug)) {
    errors.push(`${label}.slug is required`);
  }
  if (!isNonEmptyString(page.title)) {
    errors.push(`${label}.title is required`);
  }
  if (typeof page.depth !== "number" || page.depth < 0) {
    errors.push(`${label}.depth must be >= 0`);
  }
  if (typeof page.priority !== "number") {
    errors.push(`${label}.priority is required`);
  }
  if (typeof page.visible !== "boolean") {
    errors.push(`${label}.visible is required`);
  }
  if (!page.navigation) {
    errors.push(`${label}.navigation is required`);
  }
  if (!page.sections || page.sections.length === 0) {
    errors.push(`${label} ("${page.slug ?? "?"}") must have at least one section`);
  }
  if (!page.seo) {
    errors.push(`${label} ("${page.slug ?? "?"}") is missing seo`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// SEO validation
// ---------------------------------------------------------------------------

function validateSeo(seo: Partial<WebsiteSeo>): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(seo.title)) {
    errors.push("seo.title is required");
  }
  if (!isNonEmptyString(seo.description)) {
    errors.push("seo.description is required");
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Structure validation
// ---------------------------------------------------------------------------

/**
 * Validate a (potentially partial) website structure.
 * Returns a list of validation error messages; an empty list means valid.
 */
export function validateWebsiteStructure(
  structure: Partial<WebsiteStructure>,
): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(structure.id)) {
    errors.push("id is required");
  }
  if (!isNonEmptyString(structure.userId)) {
    errors.push("userId is required");
  }
  if (
    structure.websiteType !== undefined &&
    !SUPPORTED_WEBSITE_TYPES_STRUCTURE.includes(structure.websiteType)
  ) {
    errors.push("websiteType must be one of the supported website types");
  }
  if (!isNonEmptyString(structure.siteTitle)) {
    errors.push("siteTitle is required");
  }
  if (!isNonEmptyString(structure.tagline)) {
    errors.push("tagline is required");
  }
  if (!structure.pages || structure.pages.length === 0) {
    errors.push("pages must include at least one page");
  } else {
    for (let i = 0; i < structure.pages.length; i++) {
      errors.push(...validatePage(structure.pages[i], i));
    }
  }
  if (!structure.navigation) {
    errors.push("navigation is required");
  } else if (
    !structure.navigation.primary ||
    structure.navigation.primary.length === 0
  ) {
    errors.push("navigation.primary must include at least one item");
  } else {
    const navigationPaths =
      structure.navigation.hierarchy?.nodes?.map((node) => node.path) ?? [];
    const pageSlugs = new Set((structure.pages ?? []).map((page) => page.slug));
    const pageRoutes = new Set(
      navigationPaths.length > 0 ? navigationPaths : Array.from(pageSlugs),
    );
    for (const item of structure.navigation.primary) {
      if (item.href.startsWith("/") && !pageRoutes.has(item.href)) {
        errors.push(`navigation.primary href not found in pages: ${item.href}`);
      }
    }
  }
  if (!structure.seo) {
    errors.push("seo is required");
  } else {
    errors.push(...validateSeo(structure.seo));
  }
  if (!structure.styleConfig) {
    errors.push("styleConfig is required");
  }
  if (!isNonEmptyString(structure.status)) {
    errors.push("status is required");
  }
  if (
    structure.status !== undefined &&
    !SUPPORTED_STRUCTURE_STATUSES.includes(structure.status)
  ) {
    errors.push("status must be draft, published, or archived");
  }
  if (typeof structure.version !== "number" || structure.version < 1) {
    errors.push("version must be a positive integer");
  }

  return errors;
}

/**
 * Type guard — returns true only when the structure passes all validations.
 */
export function isValidStructure(
  structure: Partial<WebsiteStructure>,
): structure is WebsiteStructure {
  return validateWebsiteStructure(structure).length === 0;
}
