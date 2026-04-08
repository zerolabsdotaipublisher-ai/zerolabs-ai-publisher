import { routes, config } from "@/config";
import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { buildCanonicalUrl, normalizeCanonicalBaseUrl } from "./canonical";
import { createFallbackPageDescription } from "./descriptions";
import { buildOpenGraphMetadata } from "./og";
import { createFallbackPageTitle } from "./titles";
import type {
  GeneratedPageMetadata,
  GeneratedSiteMetadata,
  SeoGenerationContextPage,
  WebsiteSeoPackage,
} from "./types";

function seoId(structureId: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `wseo_${structureId}_${ts}_${rnd}`;
}

export function createSeoGenerationContexts(
  structure: WebsiteStructure,
  maxSectionsPerPage = 4,
): SeoGenerationContextPage[] {
  return structure.pages.map((page) => ({
    pageSlug: page.slug,
    pageType: page.type,
    pageTitle: page.title,
    sectionHeadlines: page.sections
      .map((section) => {
        const headline = (section.content as { headline?: string }).headline;
        return typeof headline === "string" ? headline.trim() : section.type;
      })
      .filter(Boolean)
      .slice(0, maxSectionsPerPage),
  }));
}

export function createFallbackSiteMetadata(
  input: WebsiteGenerationInput,
  canonicalBaseUrl: string,
): GeneratedSiteMetadata {
  const title = `${input.brandName} | ${input.primaryCta}`.slice(0, 60).trim();
  const description = `${input.brandName} helps ${input.targetAudience} with ${input.services.slice(0, 3).join(", ")}. ${input.description}`
    .replace(/\s+/g, " ")
    .slice(0, 160)
    .trim();
  const keywords = Array.from(
    new Set([input.brandName, input.websiteType, ...input.services].map((value) => value.trim()).filter(Boolean)),
  ).slice(0, 12);

  const canonical = buildCanonicalUrl(canonicalBaseUrl, routes.generatedSite("preview"), "/");

  return {
    title,
    description,
    keywords,
    canonicalBaseUrl,
    defaultOpenGraph: buildOpenGraphMetadata({
      title,
      description,
      canonicalUrl: canonical,
      type: "website",
    }),
  };
}

export function createFallbackPageMetadata(
  brandName: string,
  canonicalBaseUrl: string,
  structureId: string,
  page: SeoGenerationContextPage,
): GeneratedPageMetadata {
  const title = createFallbackPageTitle(brandName, page);
  const description = createFallbackPageDescription(brandName, page);
  const canonicalUrl = buildCanonicalUrl(
    canonicalBaseUrl,
    routes.generatedSite(structureId),
    page.pageSlug,
  );

  return {
    pageSlug: page.pageSlug,
    pageType: page.pageType,
    title,
    description,
    keywords: [brandName, page.pageType, ...page.sectionHeadlines].slice(0, 10),
    canonicalUrl,
    openGraph: buildOpenGraphMetadata({
      title,
      description,
      canonicalUrl,
      type: page.pageType === "custom" ? "article" : "website",
    }),
  };
}

export function createFallbackWebsiteSeoPackage(args: {
  structure: WebsiteStructure;
  input: WebsiteGenerationInput;
  userId: string;
  version: number;
  maxSectionsPerPage?: number;
}): WebsiteSeoPackage {
  const now = new Date().toISOString();
  const canonicalBaseUrl = normalizeCanonicalBaseUrl(config.app.url);
  const contexts = createSeoGenerationContexts(args.structure, args.maxSectionsPerPage);

  return {
    id: seoId(args.structure.id),
    structureId: args.structure.id,
    userId: args.userId,
    websiteType: args.structure.websiteType,
    site: createFallbackSiteMetadata(args.input, canonicalBaseUrl),
    pages: contexts.map((page) =>
      createFallbackPageMetadata(args.input.brandName, canonicalBaseUrl, args.structure.id, page),
    ),
    generatedFromInput: args.input,
    generatedAt: now,
    updatedAt: now,
    version: args.version,
  };
}
