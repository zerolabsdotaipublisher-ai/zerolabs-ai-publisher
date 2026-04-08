import type { SeoOverrideInput, WebsiteSeoPackage } from "./types";

function uniqueKeywords(values: string[] | undefined): string[] | undefined {
  if (!values?.length) return undefined;
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 12);
}

export function applySeoOverrides(
  seo: WebsiteSeoPackage,
  overrides?: SeoOverrideInput,
): WebsiteSeoPackage {
  if (!overrides) return seo;

  const next = {
    ...seo,
    site: {
      ...seo.site,
      title: overrides.site?.title?.trim() || seo.site.title,
      description: overrides.site?.description?.trim() || seo.site.description,
      keywords: uniqueKeywords(overrides.site?.keywords) || seo.site.keywords,
    },
    pages: seo.pages.map((page) => {
      const pageOverride = overrides.pages?.[page.pageSlug];
      if (!pageOverride) return page;

      const title = pageOverride.title?.trim() || page.title;
      const description = pageOverride.description?.trim() || page.description;
      const canonicalUrl = pageOverride.canonicalUrl?.trim() || page.canonicalUrl;

      return {
        ...page,
        title,
        description,
        canonicalUrl,
        keywords: uniqueKeywords(pageOverride.keywords) || page.keywords,
        openGraph: {
          ...page.openGraph,
          title,
          description,
          url: canonicalUrl,
        },
      };
    }),
    updatedAt: new Date().toISOString(),
  };

  next.site.defaultOpenGraph = {
    ...next.site.defaultOpenGraph,
    title: next.site.title,
    description: next.site.description,
  };

  return next;
}
