export type {
  LayoutVariantName,
  SectionSlot,
  Breakpoint,
  ColumnMode,
  StackBehavior,
  HeroLayoutMode,
  SpacingScale,
  AlignmentMode,
  WidthConstraint,
  ContainerVariant,
  LayoutStyleTag,
  EmphasisPattern,
  ColorStrategyHook,
  ResponsiveHint,
  SectionSpacingRule,
  SectionAlignmentRule,
  LayoutMetadata,
  SectionLayoutNode,
  SectionLayoutGroup,
  PageLayoutModel,
  WebsiteLayoutModel,
  LayoutTemplate,
  LayoutGenerationContext,
  LayoutOverrides,
  LayoutGenerationOptions,
  LayoutGenerationResult,
  LayoutComposedStructure,
} from "./types";

export { LAYOUT_TEMPLATES, getLayoutTemplate, getTemplateForPage } from "./templates";

export { orderSectionsByPageType, orderSectionsWithCustomIds } from "./ordering";

export { getResponsiveHintsForSection, DEFAULT_RESPONSIVE_HINTS } from "./responsive";

export { getSectionSpacingRule } from "./spacing";

export { getSectionAlignmentRule } from "./alignment";

export {
  DEFAULT_LAYOUT_VARIANT,
  DEFAULT_SPACING_SCALE,
  ensureTemplate,
  createFallbackSectionNode,
  ensurePageLayoutDefaults,
} from "./fallback";

export { generateLayoutMetadata } from "./metadata";

export { mapStructureToLayout } from "./mapper";

export {
  SUPPORTED_LAYOUT_VARIANTS,
  validateWebsiteLayoutModel,
  isValidWebsiteLayoutModel,
} from "./schemas";

export { ensureValidWebsiteLayout } from "./validation";

export {
  sanitizeLayoutOverrides,
  applyLayoutVisibilityOverrides,
} from "./overrides";

export { getCachedLayout, setCachedLayout } from "./performance";

export { generatePageLayouts, generatePageLayoutForPage } from "./engine";

export {
  portfolioLayoutFixture,
  businessSiteLayoutFixture,
  landingPageLayoutFixture,
  personalBrandLayoutFixture,
  edgeCaseLayoutFixture,
} from "./fixtures";
