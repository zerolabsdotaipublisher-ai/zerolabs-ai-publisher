import { validateWebsiteStructure } from "@/lib/ai/structure/schemas";
import type { WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import { isReservedRoutePath, isValidRoutePath } from "@/lib/routing";
import { isContentLinkField, isSafeContentLink } from "./content-links";
import type { EditorValidationError } from "./types";

function ensureSlugValidation(structure: WebsiteStructure, errors: EditorValidationError[]): void {
  const seen = new Set<string>();

  structure.pages.forEach((page, pageIndex) => {
    if (!isValidRoutePath(page.slug)) {
      errors.push({
        field: `pages.${pageIndex}.slug`,
        message: `Slug "${page.slug}" must be "/" or use lowercase letters, numbers, and hyphens.`,
      });
    }
    if (isReservedRoutePath(page.slug)) {
      errors.push({
        field: `pages.${pageIndex}.slug`,
        message: `Slug "${page.slug}" is reserved for application system routes.`,
      });
    }

    if (seen.has(page.slug)) {
      errors.push({
        field: `pages.${pageIndex}.slug`,
        message: `Slug "${page.slug}" is duplicated across pages.`,
      });
    }

    seen.add(page.slug);
  });
}

function ensureSectionValidation(section: WebsiteSection, path: string, errors: EditorValidationError[]): void {
  validateSectionContentLinks(section.content, `${path}.content`, errors);

  if (!section.visible) {
    return;
  }

  if (!section.content || typeof section.content !== "object") {
    errors.push({
      field: `${path}.content`,
      message: "Visible sections must include a content object.",
    });
    return;
  }

  const hasText = Object.values(section.content).some((value) => {
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && typeof value === "object";
  });

  if (!hasText) {
    errors.push({
      field: `${path}.content`,
      message: "Visible sections must contain at least one non-empty content field.",
    });
  }

}

function validateSectionContentLinks(value: unknown, path: string, errors: EditorValidationError[]): void {
  if (typeof value === "string") {
    if (isContentLinkField(path) && !isSafeContentLink(value)) {
      errors.push({
        field: path,
        message: "Links cannot use javascript:, vbscript:, or data: URLs.",
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateSectionContentLinks(entry, `${path}.${index}`, errors));
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      validateSectionContentLinks(entry, `${path}.${key}`, errors);
    });
  }
}

export function validateEditorDraft(structure: WebsiteStructure): EditorValidationError[] {
  const errors: EditorValidationError[] = [];

  validateWebsiteStructure(structure).forEach((message) => {
    errors.push({
      field: "structure",
      message,
    });
  });

  ensureSlugValidation(structure, errors);

  structure.pages.forEach((page, pageIndex) => {
    page.sections.forEach((section, sectionIndex) => {
      ensureSectionValidation(section, `pages.${pageIndex}.sections.${sectionIndex}`, errors);
    });

    const heroCount = page.sections.filter((section) => section.type === "hero").length;
    if (heroCount === 0) {
      errors.push({
        field: `pages.${pageIndex}.sections`,
        message: "Each page must keep at least one hero section.",
      });
    }
  });

  return errors;
}
