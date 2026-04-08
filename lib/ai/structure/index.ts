/**
 * Public API for the website structure generation module.
 *
 * Import from "@/lib/ai/structure" for all structure types, generation,
 * validation, storage, and fixture access.
 *
 * Relationship to Story 3-1:
 *   The prompt system (lib/ai/prompts) remains the source of prompt templates
 *   and the WebsiteGenerationOutput contract.  This module consumes that
 *   output and owns the downstream structure model, generation service,
 *   persistence, and rendering pipeline.
 */

// Types and enumerations
export type {
  WebsiteType,
  TonePreset,
  StylePreset,
  WebsiteStructureStatus,
  PageType,
  SectionType,
  ComponentType,
  WebsiteComponent,
  SectionStyleHints,
  WebsiteSection,
  PageSeo,
  WebsitePage,
  WebsiteSeo,
  WebsiteStyleConfig,
  ContentVariation,
  WebsiteStructure,
  StructureGenerationResult,
  WebsiteStructureRow,
} from "./types";

export type {
  NavigationLocation,
  NavigationStyle,
  PageNavigationFlags,
  PageHierarchyNode,
  PageHierarchyModel,
  NavigationMenuItem,
  NavigationMenu,
  NavigationItem,
  WebsiteNavigation,
  NavigationPageSeed,
  NavigationGenerationContext,
  NavigationOverrideInput,
} from "../navigation/types";

// Schema validation
export {
  SUPPORTED_STRUCTURE_STATUSES,
  SUPPORTED_WEBSITE_TYPES_STRUCTURE,
  validateWebsiteStructure,
  isValidStructure,
} from "./schemas";

// Templates
export type { WebsiteTemplate } from "./templates";
export { getWebsiteTemplate, getAllTemplates } from "./templates";

// Fallbacks
export { applyFallbacks, needsFallback } from "./fallback";

// Navigation generation
export { generateNavigation } from "./navigation";
export * as navigation from "../navigation";

// Metadata / SEO generation
export { generateSiteSeo, generatePageSeo } from "./metadata";

// Output → structure mapping
export { mapOutputToStructure } from "./mapper";

// Render-readiness validation
export {
  hasMinimumRenderableStructure,
} from "./validation";

// Generation service
export { generateWebsiteStructure } from "./generator";

// Regeneration
export { regenerateWebsiteStructure } from "./regeneration";

// Storage
export {
  storeWebsiteStructure,
  updateWebsiteStructure,
  getWebsiteStructure,
  listWebsiteStructures,
} from "./storage";

// Layout module (Story 3-3)
export * as layout from "../layout";
// Content module (Story 3-4)
export * as content from "../content";

// Fixtures (testing / development use only)
export {
  portfolioStructureFixture,
  businessSiteStructureFixture,
  landingPageStructureFixture,
  personalBrandStructureFixture,
  edgeCaseStructureFixture,
} from "./fixtures";
