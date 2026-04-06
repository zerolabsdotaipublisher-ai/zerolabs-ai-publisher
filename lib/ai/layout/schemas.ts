import type {
  LayoutVariantName,
  PageLayoutModel,
  SectionLayoutNode,
  WebsiteLayoutModel,
} from "./types";

export const SUPPORTED_LAYOUT_VARIANTS: LayoutVariantName[] = [
  "hero-first",
  "content-heavy",
  "minimal",
  "grid-based",
  "services-first",
  "contact-focused",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSectionNode(node: Partial<SectionLayoutNode>, index: number): string[] {
  const label = `sectionLayouts[${index}]`;
  const errors: string[] = [];

  if (!isNonEmptyString(node.sectionId)) errors.push(`${label}.sectionId is required`);
  if (!isNonEmptyString(node.pageId)) errors.push(`${label}.pageId is required`);
  if (!isNonEmptyString(node.pageSlug)) errors.push(`${label}.pageSlug is required`);
  if (typeof node.order !== "number") errors.push(`${label}.order must be a number`);
  if (!node.responsive) errors.push(`${label}.responsive is required`);
  if (!node.spacing) errors.push(`${label}.spacing is required`);
  if (!node.alignment) errors.push(`${label}.alignment is required`);

  return errors;
}

function validatePageLayout(page: Partial<PageLayoutModel>, index: number): string[] {
  const label = `pages[${index}]`;
  const errors: string[] = [];

  if (!isNonEmptyString(page.pageId)) errors.push(`${label}.pageId is required`);
  if (!isNonEmptyString(page.pageSlug)) errors.push(`${label}.pageSlug is required`);
  if (!page.templateName || !SUPPORTED_LAYOUT_VARIANTS.includes(page.templateName)) {
    errors.push(`${label}.templateName must be a supported layout variant`);
  }

  if (!page.sectionLayouts || page.sectionLayouts.length === 0) {
    errors.push(`${label}.sectionLayouts must include at least one section`);
  } else {
    page.sectionLayouts.forEach((node, nodeIndex) => {
      errors.push(...validateSectionNode(node, nodeIndex));
    });
  }

  if (!page.responsiveDefaults) {
    errors.push(`${label}.responsiveDefaults is required`);
  }
  if (!page.metadata) {
    errors.push(`${label}.metadata is required`);
  }

  return errors;
}

export function validateWebsiteLayoutModel(layout: Partial<WebsiteLayoutModel>): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(layout.structureId)) errors.push("structureId is required");
  if (!layout.websiteType) errors.push("websiteType is required");
  if (!isNonEmptyString(layout.generatedAt)) errors.push("generatedAt is required");
  if (typeof layout.version !== "number" || layout.version < 1) {
    errors.push("version must be a positive integer");
  }

  if (!layout.pages || layout.pages.length === 0) {
    errors.push("pages must include at least one layout page");
  } else {
    layout.pages.forEach((page, index) => {
      errors.push(...validatePageLayout(page, index));
    });
  }

  return errors;
}

export function isValidWebsiteLayoutModel(
  layout: Partial<WebsiteLayoutModel>,
): layout is WebsiteLayoutModel {
  return validateWebsiteLayoutModel(layout).length === 0;
}
