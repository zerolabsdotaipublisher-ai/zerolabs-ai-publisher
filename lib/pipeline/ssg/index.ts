export type {
  StaticGenerationMode,
  StaticSiteEnvironment,
  StaticRouteKind,
  StaticAssetKind,
  StaticAssetSource,
  StaticCachePolicyId,
  StaticValidationSeverity,
  StaticValidationCode,
  StaticPageDataRequirementKey,
  StaticPageDataRequirement,
  StaticPageInputCompleteness,
  StaticSeoMetadata,
  StaticPageRoute,
  StaticAssetReference,
  StaticPageData,
  StaticSiteData,
  StaticGenerationStrategy,
  StaticCachePolicy,
  StaticCacheStrategy,
  StaticOutputFileExpectation,
  StaticOutputManifest,
  StaticValidationIssue,
  StaticValidationResult,
  StaticOutputMetrics,
  StaticSiteArtifact,
  StaticSiteResolutionInput,
  NextStaticPageParams,
  NextStaticGenerationConfig,
  NextStaticPageMetadata,
} from "./types";

export {
  STATIC_PAGE_DATA_REQUIREMENTS,
  resolveStaticPageData,
  resolveStaticSiteData,
  resolveStaticSitesData,
} from "./data";

export {
  createStaticPageRoute,
  createStaticPageRoutes,
  createStaticRouteValidationIssues,
  createNextStaticParamsFromRoutes,
  createNextStaticParamsFromSites,
  createGeneratedSiteRoutePath,
  createPreviewRoutePath,
} from "./routes";

export {
  STATIC_GENERATION_STRATEGY,
  createStaticOutputManifest,
  validateStaticSiteArtifact,
  buildStaticSiteOutput,
} from "./output";

export {
  STATIC_CACHE_POLICIES,
  STATIC_CACHE_STRATEGY,
  STATIC_ISR_REVALIDATE,
  getStaticCachePolicy,
} from "./cache";

export {
  validateStaticPageData,
  validateStaticSiteData,
  validateStaticOutputManifest,
  validateStaticCacheStrategy,
  validateStaticSiteReadiness,
  staticValidationMessages,
  createStaticValidationResult,
} from "./validation";

export {
  NEXT_STATIC_GENERATION_CONFIG,
  createNextStaticParamsForRoutes,
  createNextStaticParamsForSites,
  createNextMetadataForStaticPage,
} from "./framework";

export {
  multiPageStaticSiteStructureFixture,
  hiddenPageStaticSiteStructureFixture,
  invalidStaticSiteStructureFixture,
  staticSiteScenarios,
  type StaticSiteScenario,
} from "./scenarios";
