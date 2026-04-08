export type {
  SeoOpenGraph,
  GeneratedPageMetadata,
  GeneratedSiteMetadata,
  WebsiteSeoPackage,
  SeoGenerationContextPage,
  SeoGenerationOptions,
  SeoOverrideInput,
  SeoGenerationResult,
  WebsiteSeoMetadataRow,
} from "./types";

export { SEO_METADATA_REQUIREMENTS } from "./requirements";

export { validateWebsiteSeoShape, isValidWebsiteSeoShape } from "./schemas";

export { getSeoStrategyForPageType, type SeoPageStrategy } from "./strategy";

export { buildWebsiteSeoPrompt, seoOutputContractJson } from "./prompts";

export { normalizeSeoTitle, createFallbackPageTitle } from "./titles";

export { normalizeSeoDescription, createFallbackPageDescription } from "./descriptions";

export { buildOpenGraphMetadata } from "./og";

export { buildCanonicalUrl, normalizeCanonicalBaseUrl } from "./canonical";

export {
  createFallbackWebsiteSeoPackage,
  createFallbackPageMetadata,
  createFallbackSiteMetadata,
  createSeoGenerationContexts,
} from "./fallback";

export { validateGeneratedWebsiteSeo } from "./validation";

export { applySeoOverrides } from "./overrides";

export { generateWebsiteSeo } from "./service";

export { storeWebsiteSeoMetadata, getWebsiteSeoMetadata } from "./storage";

export {
  WEBSITE_SEO_EVALUATION_CRITERIA,
  type SeoEvaluationCriterion,
} from "./evaluation";

export {
  businessSiteSeoFixture,
  portfolioSeoFixture,
  landingPageSeoFixture,
  personalBrandSeoFixture,
  edgeCaseSeoFixture,
} from "./fixtures";
