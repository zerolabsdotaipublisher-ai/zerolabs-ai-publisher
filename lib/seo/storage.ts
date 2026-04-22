import type { GeneratedPageMetadata, GeneratedSiteMetadata, WebsiteSeoPackage } from "@/lib/ai/seo";
import type { PageSeo, WebsiteStructure } from "@/lib/ai/structure";
import type { GeneratedArticle } from "@/lib/article";
import type { GeneratedBlogPost } from "@/lib/blog";
import type { SeoContentMetadata, SeoPreviewPayload } from "./types";

function toPagePreview(page: { slug: string; seo: PageSeo }): SeoContentMetadata | null {
  return page.seo.contentOptimization ?? null;
}

export function buildSeoPreviewPayload(args: {
  structure: WebsiteStructure;
  contentType: "website" | "blog" | "article";
  site?: GeneratedSiteMetadata | null;
  pages?: GeneratedPageMetadata[];
}): SeoPreviewPayload {
  const structurePages = args.structure.pages.map((page) => toPagePreview(page)).filter(Boolean) as SeoContentMetadata[];
  const mappedPages =
    args.pages
      ?.map((page) => page.contentOptimization)
      .filter(Boolean) as SeoContentMetadata[] | undefined;

  return {
    structureId: args.structure.id,
    contentType: args.contentType,
    site: args.site?.contentOptimization ?? null,
    pages: mappedPages?.length ? mappedPages : structurePages,
  };
}

export function applySeoContentOverride(pageSeo: PageSeo, override: Partial<SeoContentMetadata>): PageSeo {
  const nextOptimization = pageSeo.contentOptimization
    ? {
        ...pageSeo.contentOptimization,
        ...override,
        keywordStrategy: {
          ...pageSeo.contentOptimization.keywordStrategy,
          ...(override.keywordStrategy ?? {}),
        },
        headingStructure: {
          ...pageSeo.contentOptimization.headingStructure,
          ...(override.headingStructure ?? {}),
        },
        readability: {
          ...pageSeo.contentOptimization.readability,
          ...(override.readability ?? {}),
        },
        length: {
          ...pageSeo.contentOptimization.length,
          ...(override.length ?? {}),
        },
        guardrails: {
          ...pageSeo.contentOptimization.guardrails,
          ...(override.guardrails ?? {}),
        },
        validation: {
          ...pageSeo.contentOptimization.validation,
          ...(override.validation ?? {}),
        },
        score: {
          ...pageSeo.contentOptimization.score,
          ...(override.score ?? {}),
          breakdown: {
            ...pageSeo.contentOptimization.score.breakdown,
            ...(override.score?.breakdown ?? {}),
          },
        },
        performance: {
          ...pageSeo.contentOptimization.performance,
          ...(override.performance ?? {}),
        },
      }
    : undefined;

  return {
    ...pageSeo,
    title: override.titleTag ?? pageSeo.title,
    description: override.metaDescription ?? pageSeo.description,
    keywords: override.keywordStrategy
      ? [override.keywordStrategy.primaryKeyword, ...override.keywordStrategy.secondaryKeywords]
      : pageSeo.keywords,
    contentOptimization: nextOptimization,
  };
}

export function applySeoOverrideToStructure(args: {
  structure: WebsiteStructure;
  pageSlug: string;
  override: Partial<SeoContentMetadata>;
}): WebsiteStructure {
  return {
    ...args.structure,
    pages: args.structure.pages.map((page) =>
      page.slug === args.pageSlug
        ? {
            ...page,
            seo: applySeoContentOverride(page.seo, args.override),
          }
        : page,
    ),
  };
}

export function applySeoOverrideToBlog(blog: GeneratedBlogPost, override: Partial<SeoContentMetadata>): GeneratedBlogPost {
  return {
    ...blog,
    seo: {
      ...blog.seo,
      metaTitle: override.titleTag ?? blog.seo.metaTitle,
      metaDescription: override.metaDescription ?? blog.seo.metaDescription,
      focusKeyword: override.keywordStrategy?.primaryKeyword ?? blog.seo.focusKeyword,
      secondaryKeywords: override.keywordStrategy?.secondaryKeywords ?? blog.seo.secondaryKeywords,
      headingOutline: override.headingStructure ?? blog.seo.headingOutline,
      optimization: blog.seo.optimization
        ? {
            ...blog.seo.optimization,
            ...override,
          }
        : blog.seo.optimization,
    },
  };
}

export function applySeoOverrideToArticle(article: GeneratedArticle, override: Partial<SeoContentMetadata>): GeneratedArticle {
  return {
    ...article,
    seo: {
      ...article.seo,
      metaTitle: override.titleTag ?? article.seo.metaTitle,
      metaDescription: override.metaDescription ?? article.seo.metaDescription,
      focusKeyword: override.keywordStrategy?.primaryKeyword ?? article.seo.focusKeyword,
      secondaryKeywords: override.keywordStrategy?.secondaryKeywords ?? article.seo.secondaryKeywords,
      headingOutline: override.headingStructure ?? article.seo.headingOutline,
      optimization: article.seo.optimization
        ? {
            ...article.seo.optimization,
            ...override,
          }
        : article.seo.optimization,
    },
  };
}

export function syncPageSeoFromOptimization(pageSeo: PageSeo): PageSeo {
  if (!pageSeo.contentOptimization) {
    return pageSeo;
  }

  return {
    ...pageSeo,
    title: pageSeo.contentOptimization.titleTag,
    description: pageSeo.contentOptimization.metaDescription,
    keywords: [
      pageSeo.contentOptimization.keywordStrategy.primaryKeyword,
      ...pageSeo.contentOptimization.keywordStrategy.secondaryKeywords,
    ],
  };
}

export function syncWebsiteSeoPackage(seo: WebsiteSeoPackage): WebsiteSeoPackage {
  return {
    ...seo,
    site: seo.site.contentOptimization
      ? {
          ...seo.site,
          title: seo.site.contentOptimization.titleTag,
          description: seo.site.contentOptimization.metaDescription,
          keywords: [
            seo.site.contentOptimization.keywordStrategy.primaryKeyword,
            ...seo.site.contentOptimization.keywordStrategy.secondaryKeywords,
          ],
        }
      : seo.site,
    pages: seo.pages.map((page) =>
      page.contentOptimization
        ? {
            ...page,
            title: page.contentOptimization.titleTag,
            description: page.contentOptimization.metaDescription,
            keywords: [
              page.contentOptimization.keywordStrategy.primaryKeyword,
              ...page.contentOptimization.keywordStrategy.secondaryKeywords,
            ],
          }
        : page,
    ),
  };
}
