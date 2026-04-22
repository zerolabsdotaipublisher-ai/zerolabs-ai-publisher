import type { SeoContentMetadata } from "@/lib/seo";
import type { WebsiteGenerationInput, WebsiteType } from "../prompts/types";
import type { PageType, WebsiteStructure } from "../structure/types";

export interface SeoOpenGraph {
  title: string;
  description: string;
  type: "website" | "article";
  url: string;
  image?: string;
}

export interface GeneratedPageMetadata {
  pageSlug: string;
  pageType: PageType;
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  openGraph: SeoOpenGraph;
  contentOptimization?: SeoContentMetadata;
}

export interface GeneratedSiteMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalBaseUrl: string;
  defaultOpenGraph: SeoOpenGraph;
  contentOptimization?: SeoContentMetadata;
}

export interface WebsiteSeoPackage {
  id: string;
  structureId: string;
  userId: string;
  websiteType: WebsiteType;
  site: GeneratedSiteMetadata;
  pages: GeneratedPageMetadata[];
  generatedFromInput: WebsiteGenerationInput;
  generatedAt: string;
  updatedAt: string;
  version: number;
}

export interface SeoGenerationContextPage {
  pageSlug: string;
  pageType: PageType;
  pageTitle: string;
  sectionHeadlines: string[];
}

export interface SeoGenerationOptions {
  pages?: string[];
  maxRetries?: number;
  maxSectionsPerPage?: number;
  version?: number;
  overrides?: SeoOverrideInput;
}

export interface SeoOverrideInput {
  site?: Partial<Pick<GeneratedSiteMetadata, "title" | "description" | "keywords">>;
  pages?: Record<
    string,
    Partial<
      Pick<GeneratedPageMetadata, "title" | "description" | "keywords" | "canonicalUrl">
    >
  >;
}

export interface SeoGenerationResult {
  seo: WebsiteSeoPackage;
  mappedStructure: WebsiteStructure;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface WebsiteSeoMetadataRow {
  id: string;
  structure_id: string;
  user_id: string;
  page_slug: string;
  metadata_json: unknown;
  generated_from_input: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}
