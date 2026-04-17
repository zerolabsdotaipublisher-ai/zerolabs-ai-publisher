import { STATIC_CACHE_STRATEGY } from "./cache";
import { resolveStaticSiteData } from "./data";
import {
  createStaticValidationResult,
  validateStaticCacheStrategy,
  validateStaticOutputManifest,
  validateStaticSiteData,
} from "./validation";
import type {
  StaticGenerationStrategy,
  StaticOutputFileExpectation,
  StaticOutputManifest,
  StaticOutputMetrics,
  StaticSiteArtifact,
  StaticSiteResolutionInput,
  StaticSiteData,
  StaticValidationIssue,
  StaticValidationResult,
} from "./types";

export const STATIC_GENERATION_STRATEGY: StaticGenerationStrategy = {
  owner: "ai-publisher",
  mode: "build-time",
  staticallyGenerated: "visible-pages",
  onDemandScope: "none",
  hybridScope: "none",
  previewBehavior: "ssg-artifacts-plus-live-preview-route",
  productionBehavior: "ssg-artifacts-for-deployment-adapter",
  isr: "foundation-disabled-for-mvp",
};

function estimateBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function createOutputFileExpectations(data: StaticSiteData): StaticOutputFileExpectation[] {
  return [
    {
      path: "manifest/static-site.json",
      kind: "manifest",
      required: true,
    },
    {
      path: "routes/static-routes.json",
      kind: "route-manifest",
      required: true,
    },
    {
      path: "assets/manifest.json",
      kind: "asset-manifest",
      required: true,
    },
    {
      path: "cache/policies.json",
      kind: "cache-policy",
      required: true,
    },
    ...data.pages.map((page) => ({
      path: page.route.dataPath,
      kind: "page-data" as const,
      required: true,
    })),
  ];
}

export function createStaticOutputManifest(data: StaticSiteData): StaticOutputManifest {
  return {
    format: "static-site-output-v1",
    basePath: "/",
    manifestPath: "manifest/static-site.json",
    routeManifestPath: "routes/static-routes.json",
    assetManifestPath: "assets/manifest.json",
    cachePolicyPath: "cache/policies.json",
    pageDataDirectory: `data/${data.structureId}/pages`,
    expectedFiles: createOutputFileExpectations(data),
  };
}

function createStaticOutputMetrics(data: StaticSiteData): StaticOutputMetrics {
  return {
    routeCount: data.routes.length,
    pageCount: data.pages.length,
    assetCount: data.assets.length,
    estimatedPageDataBytes: estimateBytes(data.pages),
  };
}

function mergeValidationResults(results: StaticValidationResult[]): StaticValidationResult {
  return createStaticValidationResult([
    ...results.flatMap((result) => result.errors),
    ...results.flatMap((result) => result.warnings),
  ]);
}

export function validateStaticSiteArtifact(params: {
  artifact: Omit<StaticSiteArtifact, "validation">;
  structure: StaticSiteResolutionInput["structure"];
}): StaticValidationResult {
  const outputIssues: StaticValidationIssue[] = [
    ...validateStaticOutputManifest(params.artifact.output),
    ...validateStaticCacheStrategy(params.artifact.cache),
  ];

  return mergeValidationResults([
    validateStaticSiteData({
      data: params.artifact.data,
      structure: params.structure,
    }),
    createStaticValidationResult(outputIssues),
  ]);
}

export function buildStaticSiteOutput(input: StaticSiteResolutionInput): StaticSiteArtifact {
  const data = resolveStaticSiteData(input);
  const output = createStaticOutputManifest(data);
  const artifactWithoutValidation: Omit<StaticSiteArtifact, "validation"> = {
    format: "static-site-generation-v1",
    strategy: STATIC_GENERATION_STRATEGY,
    data,
    output,
    cache: STATIC_CACHE_STRATEGY,
    metrics: createStaticOutputMetrics(data),
  };
  const validation = validateStaticSiteArtifact({
    artifact: artifactWithoutValidation,
    structure: input.structure,
  });

  return {
    ...artifactWithoutValidation,
    validation,
  };
}
