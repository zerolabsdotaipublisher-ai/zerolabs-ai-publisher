import type { Metadata } from "next";
import type { PageLayoutModel } from "@/lib/ai/layout";
import type { WebsiteNavigation } from "@/lib/ai/navigation";
import type {
  PageSeo,
  WebsitePage,
  WebsiteSection,
  WebsiteSeo,
  WebsiteStructure,
  WebsiteStyleConfig,
} from "@/lib/ai/structure";

export type StaticGenerationMode = "build-time" | "on-demand" | "hybrid";
export type StaticSiteEnvironment = "preview" | "production";

export type StaticRouteKind = "page";

export type StaticAssetKind =
  | "image"
  | "open-graph-image"
  | "font"
  | "stylesheet"
  | "script"
  | "document"
  | "external";

export type StaticAssetSource =
  | "section"
  | "component"
  | "seo"
  | "layout"
  | "navigation"
  | "style";

export type StaticCachePolicyId =
  | "static-page-html"
  | "static-page-data"
  | "static-assets"
  | "external-assets";

export type StaticValidationSeverity = "error" | "warning";

export type StaticValidationCode =
  | "missing_structure"
  | "missing_page"
  | "missing_section"
  | "missing_navigation"
  | "missing_metadata"
  | "missing_layout_style"
  | "missing_asset"
  | "invalid_route"
  | "duplicate_route"
  | "missing_route"
  | "invalid_output_path"
  | "invalid_cache_policy"
  | "payload_too_large";

export type StaticPageDataRequirementKey =
  | "structure"
  | "page"
  | "sections"
  | "navigation"
  | "metadata"
  | "layoutStyle"
  | "assets";

export interface StaticPageDataRequirement {
  key: StaticPageDataRequirementKey;
  label: string;
  requiredFields: string[];
  description: string;
}

export interface StaticPageInputCompleteness {
  structure: boolean;
  page: boolean;
  sections: boolean;
  navigation: boolean;
  metadata: boolean;
  layoutStyle: boolean;
  assets: boolean;
  missing: StaticPageDataRequirementKey[];
}

export interface StaticSeoMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  openGraph?: PageSeo["openGraph"];
}

export interface StaticPageRoute {
  kind: StaticRouteKind;
  structureId: string;
  pageId: string;
  slug: string;
  path: string;
  outputPath: string;
  dataPath: string;
  title: string;
  visible: boolean;
  order: number;
  nextParams: NextStaticPageParams;
}

export interface StaticAssetReference {
  id: string;
  kind: StaticAssetKind;
  source: StaticAssetSource;
  url: string;
  required: boolean;
  pageId?: string;
  sectionId?: string;
  fieldPath?: string;
  outputPath?: string;
  cachePolicyId: StaticCachePolicyId;
}

export interface StaticPageData {
  structureId: string;
  structureVersion: number;
  siteTitle: string;
  tagline: string;
  websiteType: WebsiteStructure["websiteType"];
  page: Pick<WebsitePage, "id" | "slug" | "title" | "type" | "order" | "visible">;
  sections: WebsiteSection[];
  navigation: WebsiteNavigation;
  metadata: StaticSeoMetadata;
  siteMetadata: Pick<WebsiteSeo, "title" | "description" | "keywords" | "canonicalBaseUrl">;
  styleConfig: WebsiteStyleConfig;
  layoutPage?: PageLayoutModel;
  route: StaticPageRoute;
  assets: StaticAssetReference[];
  completeness: StaticPageInputCompleteness;
}

export interface StaticSiteData {
  structureId: string;
  structureVersion: number;
  siteTitle: string;
  websiteType: WebsiteStructure["websiteType"];
  environment: StaticSiteEnvironment;
  pages: StaticPageData[];
  routes: StaticPageRoute[];
  assets: StaticAssetReference[];
  resolvedAt: string;
}

export interface StaticGenerationStrategy {
  owner: "ai-publisher";
  mode: StaticGenerationMode;
  staticallyGenerated: "visible-pages";
  onDemandScope: "none";
  hybridScope: "none";
  previewBehavior: "ssg-artifacts-plus-live-preview-route";
  productionBehavior: "ssg-artifacts-for-deployment-adapter";
  isr: "foundation-disabled-for-mvp";
}

export interface StaticCachePolicy {
  id: StaticCachePolicyId;
  target: "html" | "json" | "asset" | "external";
  browserMaxAgeSeconds: number;
  cdnMaxAgeSeconds: number;
  staleWhileRevalidateSeconds: number;
  immutable: boolean;
  notes: string;
}

export interface StaticCacheStrategy {
  providerSpecific: false;
  policies: StaticCachePolicy[];
  defaultPagePolicyId: StaticCachePolicyId;
  defaultDataPolicyId: StaticCachePolicyId;
  defaultAssetPolicyId: StaticCachePolicyId;
}

export interface StaticOutputFileExpectation {
  path: string;
  kind: "manifest" | "route-manifest" | "page-data" | "asset-manifest" | "cache-policy";
  required: boolean;
}

export interface StaticOutputManifest {
  format: "static-site-output-v1";
  basePath: "/";
  manifestPath: string;
  routeManifestPath: string;
  assetManifestPath: string;
  cachePolicyPath: string;
  pageDataDirectory: string;
  expectedFiles: StaticOutputFileExpectation[];
}

export interface StaticValidationIssue {
  code: StaticValidationCode;
  severity: StaticValidationSeverity;
  message: string;
  pageId?: string;
  sectionId?: string;
  routePath?: string;
  fieldPath?: string;
}

export interface StaticValidationResult {
  valid: boolean;
  errors: StaticValidationIssue[];
  warnings: StaticValidationIssue[];
}

export interface StaticOutputMetrics {
  routeCount: number;
  pageCount: number;
  assetCount: number;
  estimatedPageDataBytes: number;
}

export interface StaticSiteArtifact {
  format: "static-site-generation-v1";
  strategy: StaticGenerationStrategy;
  data: StaticSiteData;
  output: StaticOutputManifest;
  cache: StaticCacheStrategy;
  validation: StaticValidationResult;
  metrics: StaticOutputMetrics;
}

export interface StaticSiteResolutionInput {
  structure: WebsiteStructure;
  environment: StaticSiteEnvironment;
  generatedAt?: string;
}

export interface NextStaticPageParams {
  id: string;
  slug?: string[];
}

export interface NextStaticGenerationConfig {
  dynamicParams: false;
  revalidate: false;
}

export type NextStaticPageMetadata = Metadata;
