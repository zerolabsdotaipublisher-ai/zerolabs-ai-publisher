export type {
  NavigationLocation,
  NavigationStyle,
  NavigationPageType,
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
  NavigationGenerationResult,
  WebsiteNavigationRow,
} from "./types";

export { getDefaultPagesForWebsiteType, createDefaultPageSeeds } from "./defaults";

export { orderPages } from "./ordering";

export { generateNavigationLabel } from "./labels";

export { buildUniquePaths } from "./paths";

export { generatePageHierarchy } from "./hierarchy";

export { applyNavigationOverrides } from "./overrides";

export { validateWebsiteNavigation, isValidWebsiteNavigation } from "./schemas";

export { createFallbackNavigation } from "./fallback";

export { ensureValidNavigation } from "./validation";

export {
  normalizeNavigationPath,
  isNavigationItemActive,
  annotateMenuActiveState,
} from "./state";

export {
  generateWebsiteNavigation,
  generateValidatedWebsiteNavigation,
} from "./generator";

export { storeWebsiteNavigation, getWebsiteNavigation } from "./storage";

export {
  businessSiteNavigationFixture,
  portfolioNavigationFixture,
  landingPageNavigationFixture,
  personalBrandNavigationFixture,
  edgeCaseNavigationFixture,
} from "./fixtures";
