import type {
  LayoutTemplate,
  LayoutVariantName,
  PageLayoutModel,
  SectionLayoutNode,
  SpacingScale,
} from "./types";
import { DEFAULT_RESPONSIVE_HINTS } from "./responsive";
import { getSectionAlignmentRule } from "./alignment";
import { getSectionSpacingRule } from "./spacing";
import { generateLayoutMetadata } from "./metadata";
import { getLayoutTemplate } from "./templates";

export const DEFAULT_LAYOUT_VARIANT: LayoutVariantName = "hero-first";
export const DEFAULT_SPACING_SCALE: SpacingScale = "comfortable";

export function ensureTemplate(
  templateName?: LayoutVariantName,
  fallback: LayoutVariantName = DEFAULT_LAYOUT_VARIANT,
): LayoutTemplate {
  return getLayoutTemplate(templateName ?? fallback);
}

export function createFallbackSectionNode(
  sectionId: string,
  sectionType: SectionLayoutNode["sectionType"],
  pageId: string,
  pageSlug: string,
  order: number,
): SectionLayoutNode {
  return {
    sectionId,
    sectionType,
    pageId,
    pageSlug,
    order,
    slot: "custom",
    visible: true,
    responsive: DEFAULT_RESPONSIVE_HINTS,
    spacing: getSectionSpacingRule(sectionType, DEFAULT_SPACING_SCALE),
    alignment: getSectionAlignmentRule(sectionType),
    metadata: {},
  };
}

export function ensurePageLayoutDefaults(page: PageLayoutModel): PageLayoutModel {
  const sectionLayouts =
    page.sectionLayouts.length > 0
      ? page.sectionLayouts
      : [
          createFallbackSectionNode(
            `${page.pageId}_fallback_section`,
            "custom",
            page.pageId,
            page.pageSlug,
            0,
          ),
        ];

  return {
    ...page,
    sectionLayouts,
    hierarchy: page.hierarchy.length > 0 ? page.hierarchy : sectionLayouts,
    responsiveDefaults: page.responsiveDefaults ?? DEFAULT_RESPONSIVE_HINTS,
    metadata:
      page.metadata ??
      generateLayoutMetadata("professional", "modern", DEFAULT_SPACING_SCALE, "Readable sans-serif hierarchy"),
  };
}
