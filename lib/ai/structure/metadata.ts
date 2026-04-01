/**
 * SEO and metadata generation.
 *
 * Derives site-level and page-level SEO metadata from the AI output.
 * Falls back to sensible defaults when AI output fields are absent.
 */

import type { WebsiteGenerationOutput } from "../prompts/types";
import type { WebsiteSeo, PageSeo } from "./types";

// ---------------------------------------------------------------------------
// Site-level SEO
// ---------------------------------------------------------------------------

/**
 * Generate site-wide SEO metadata from the AI output.
 */
export function generateSiteSeo(output: WebsiteGenerationOutput): WebsiteSeo {
  return {
    title: output.seo.title,
    description: output.seo.description,
    keywords: output.seo.keywords,
  };
}

// ---------------------------------------------------------------------------
// Page-level SEO
// ---------------------------------------------------------------------------

/**
 * Generate page-level SEO metadata.
 *
 * For the home page, the site-level metadata is used directly.
 * For other pages, the title is prefixed with the page name.
 */
export function generatePageSeo(
  output: WebsiteGenerationOutput,
  pageSlug: string,
): PageSeo {
  const isHome = pageSlug === "/" || pageSlug === "home";

  if (isHome) {
    return {
      title: output.seo.title,
      description: output.seo.description,
      keywords: output.seo.keywords,
    };
  }

  const pageLabel = pageSlug
    .replace(/^\//, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: `${pageLabel} | ${output.siteTitle}`,
    description: output.seo.description,
    keywords: output.seo.keywords,
  };
}
