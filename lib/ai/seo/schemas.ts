import type {
  GeneratedPageMetadata,
  GeneratedSiteMetadata,
  WebsiteSeoPackage,
} from "./types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSite(site: Partial<GeneratedSiteMetadata>): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(site.title)) {
    errors.push("site.title is required");
  }

  if (!isNonEmptyString(site.description)) {
    errors.push("site.description is required");
  }

  if (!isNonEmptyString(site.canonicalBaseUrl)) {
    errors.push("site.canonicalBaseUrl is required");
  }

  if (!Array.isArray(site.keywords) || site.keywords.length === 0) {
    errors.push("site.keywords is required");
  }

  return errors;
}

function validatePage(page: Partial<GeneratedPageMetadata>, index: number): string[] {
  const errors: string[] = [];
  const prefix = `pages[${index}]`;

  if (!isNonEmptyString(page.pageSlug)) {
    errors.push(`${prefix}.pageSlug is required`);
  }

  if (!isNonEmptyString(page.title)) {
    errors.push(`${prefix}.title is required`);
  }

  if (!isNonEmptyString(page.description)) {
    errors.push(`${prefix}.description is required`);
  }

  if (!isNonEmptyString(page.canonicalUrl)) {
    errors.push(`${prefix}.canonicalUrl is required`);
  }

  if (!Array.isArray(page.keywords) || page.keywords.length === 0) {
    errors.push(`${prefix}.keywords is required`);
  }

  if (!page.openGraph) {
    errors.push(`${prefix}.openGraph is required`);
  }

  return errors;
}

export function validateWebsiteSeoShape(packageCandidate: Partial<WebsiteSeoPackage>): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(packageCandidate.id)) {
    errors.push("id is required");
  }

  if (!isNonEmptyString(packageCandidate.structureId)) {
    errors.push("structureId is required");
  }

  if (!isNonEmptyString(packageCandidate.userId)) {
    errors.push("userId is required");
  }

  if (!packageCandidate.site) {
    errors.push("site is required");
  } else {
    errors.push(...validateSite(packageCandidate.site));
  }

  if (!Array.isArray(packageCandidate.pages) || packageCandidate.pages.length === 0) {
    errors.push("pages is required");
  } else {
    packageCandidate.pages.forEach((page, index) => {
      errors.push(...validatePage(page, index));
    });
  }

  if (typeof packageCandidate.version !== "number" || packageCandidate.version < 1) {
    errors.push("version must be a positive integer");
  }

  return errors;
}

export function isValidWebsiteSeoShape(
  packageCandidate: Partial<WebsiteSeoPackage>,
): packageCandidate is WebsiteSeoPackage {
  return validateWebsiteSeoShape(packageCandidate).length === 0;
}
