import type { WebsitePage, WebsiteStructure } from "../structure/types";
import { getSectionAlignmentRule } from "./alignment";
import { ensureTemplate, DEFAULT_SPACING_SCALE } from "./fallback";
import { generateLayoutMetadata } from "./metadata";
import { orderSectionsByPageType, orderSectionsWithCustomIds } from "./ordering";
import { getResponsiveHintsForSection, DEFAULT_RESPONSIVE_HINTS } from "./responsive";
import { getSectionSpacingRule } from "./spacing";
import type {
  LayoutGenerationContext,
  LayoutOverrides,
  PageLayoutModel,
  SectionLayoutNode,
  SpacingScale,
  WebsiteLayoutModel,
} from "./types";
import { getTemplateForPage } from "./templates";

function getSpacingScale(
  pageSlug: string,
  overrides?: LayoutOverrides,
): SpacingScale {
  return overrides?.spacingScaleByPageSlug?.[pageSlug] ?? DEFAULT_SPACING_SCALE;
}

function mapPageToLayout(
  page: WebsitePage,
  structure: WebsiteStructure,
  context: LayoutGenerationContext,
  overrides?: LayoutOverrides,
): PageLayoutModel {
  const templateName =
    overrides?.pageTemplateBySlug?.[page.slug] ??
    getTemplateForPage(structure.websiteType, page.type).name;
  const template = ensureTemplate(templateName);

  const customOrderIds = overrides?.sectionOrderByPageSlug?.[page.slug] ?? [];
  const sectionSeed = orderSectionsByPageType(page.sections, page.type);
  const orderedSections = orderSectionsWithCustomIds(sectionSeed, customOrderIds);

  const spacingScale = getSpacingScale(page.slug, overrides);

  const sectionLayouts: SectionLayoutNode[] = orderedSections.map((section, index) => {
    const alignmentOverride = overrides?.alignmentBySectionId?.[section.id];

    return {
      sectionId: section.id,
      sectionType: section.type,
      pageId: page.id,
      pageSlug: page.slug,
      order: index,
      slot: template.defaultSlots[section.type] ?? "custom",
      visible: section.visible,
      responsive: getResponsiveHintsForSection(section.type, spacingScale),
      spacing: getSectionSpacingRule(section.type, spacingScale),
      alignment: getSectionAlignmentRule(section.type, alignmentOverride),
      metadata: {
        emphasis: section.styleHints?.emphasis,
        layoutHint: section.styleHints?.layout,
        styleHook: `${template.name}:${section.type}`,
      },
    };
  });

  return {
    pageId: page.id,
    pageSlug: page.slug,
    pageType: page.type,
    templateName: template.name,
    hierarchy: sectionLayouts,
    sectionLayouts,
    responsiveDefaults: DEFAULT_RESPONSIVE_HINTS,
    metadata: generateLayoutMetadata(
      context.styleTone,
      context.stylePreset,
      spacingScale,
      structure.styleConfig.typographyMood,
    ),
  };
}

export function mapStructureToLayout(
  structure: WebsiteStructure,
  context: LayoutGenerationContext,
  overrides?: LayoutOverrides,
): WebsiteLayoutModel {
  const pages = structure.pages.map((page) =>
    mapPageToLayout(page, structure, context, overrides),
  );

  return {
    structureId: structure.id,
    websiteType: structure.websiteType,
    pages,
    generatedAt: new Date().toISOString(),
    version: structure.version,
  };
}
