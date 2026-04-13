import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PublishValidationResult } from "./types";

// Rules:
// - starts with "/"
// - path segments are lowercase letters/digits with optional internal hyphens
// - supports nested paths (for example "/about/team")
// - home page "/" is valid
const slugPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function validatePublishEligibility(structure: WebsiteStructure): PublishValidationResult {
  const errors: string[] = [];

  if (!structure.siteTitle.trim()) {
    errors.push("Site title is required before publishing.");
  }

  if (!structure.pages.length) {
    errors.push("At least one page is required before publishing.");
  }

  const visiblePages = structure.pages.filter((page) => page.visible !== false);
  if (!visiblePages.length) {
    errors.push("At least one visible page is required before publishing.");
  }

  const slugs = new Set<string>();
  for (const page of structure.pages) {
    if (!slugPattern.test(page.slug)) {
      errors.push(`Page \"${page.title}\" has an invalid slug.`);
    }

    if (slugs.has(page.slug)) {
      errors.push(`Page slug \"${page.slug}\" is duplicated.`);
    }
    slugs.add(page.slug);

    const visibleSections = page.sections.filter((section) => section.visible !== false);
    if (page.visible !== false && visibleSections.length === 0) {
      errors.push(`Page \"${page.title}\" must include at least one visible section.`);
    }

    if (!page.seo.title.trim() || !page.seo.description.trim()) {
      errors.push(`Page \"${page.title}\" is missing required SEO metadata.`);
    }
  }

  if (!structure.seo.title.trim() || !structure.seo.description.trim()) {
    errors.push("Site SEO title and description are required before publishing.");
  }

  if (structure.navigation.primary.length === 0) {
    errors.push("Primary navigation must include at least one item before publishing.");
  }

  if (structure.status === "archived") {
    errors.push("Archived websites cannot be published.");
  }

  return {
    eligible: errors.length === 0,
    errors,
  };
}
