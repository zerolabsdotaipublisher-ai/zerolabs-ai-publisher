import { STATIC_ISR_REVALIDATE } from "./cache";
import { createNextStaticParamsFromRoutes, createNextStaticParamsFromSites } from "./routes";
import type {
  NextStaticGenerationConfig,
  NextStaticPageMetadata,
  NextStaticPageParams,
  StaticPageData,
  StaticPageRoute,
  StaticSiteData,
} from "./types";

export const NEXT_STATIC_GENERATION_CONFIG: NextStaticGenerationConfig = {
  dynamicParams: false,
  revalidate: STATIC_ISR_REVALIDATE,
};

export function createNextStaticParamsForRoutes(
  routes: StaticPageRoute[],
): NextStaticPageParams[] {
  return createNextStaticParamsFromRoutes(routes);
}

export function createNextStaticParamsForSites(
  sites: StaticSiteData[],
): NextStaticPageParams[] {
  return createNextStaticParamsFromSites(sites);
}

export function createNextMetadataForStaticPage(
  page: StaticPageData,
): NextStaticPageMetadata {
  return {
    title: page.metadata.title,
    description: page.metadata.description,
    keywords: page.metadata.keywords,
    alternates: page.metadata.canonicalUrl
      ? { canonical: page.metadata.canonicalUrl }
      : undefined,
    openGraph: page.metadata.openGraph
      ? {
          title: page.metadata.openGraph.title,
          description: page.metadata.openGraph.description,
          type: page.metadata.openGraph.type,
          url: page.metadata.openGraph.url,
          images: page.metadata.openGraph.image
            ? [{ url: page.metadata.openGraph.image }]
            : undefined,
        }
      : undefined,
  };
}

