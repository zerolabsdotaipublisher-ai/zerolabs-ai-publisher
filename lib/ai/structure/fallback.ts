/**
 * Fallback defaults for incomplete or missing AI output.
 *
 * When the AI returns a partial or unparseable response, these defaults
 * ensure the generation pipeline always produces a renderable structure.
 * Fallbacks are keyed by section type and website type, and they use only
 * safe, generic copy that cannot be mistaken for real brand content.
 */

import type { WebsiteGenerationOutput } from "../prompts/types";
import type { WebsiteType } from "./types";
import { getWebsiteTemplate } from "./templates";

// ---------------------------------------------------------------------------
// Section-level fallback content
// ---------------------------------------------------------------------------

const FALLBACK_HERO = {
  headline: "Welcome",
  subheadline: "We are ready to help you.",
  primaryCta: "Get started",
};

const FALLBACK_ABOUT = {
  headline: "About Us",
  body: "We are passionate about delivering great results for our clients.",
};

const FALLBACK_SERVICES = {
  headline: "What We Offer",
  items: [{ name: "Our Service", description: "We provide excellent services." }],
};


const FALLBACK_FOOTER = {
  shortBlurb: "Thank you for visiting.",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply fallbacks to a partial AI output to produce a complete
 * `WebsiteGenerationOutput` suitable for mapping into a `WebsiteStructure`.
 *
 * Each field is filled with its fallback only when absent from the AI output.
 * Existing AI-generated values are always preserved.
 */
export function applyFallbacks(
  partial: Partial<WebsiteGenerationOutput>,
  websiteType: WebsiteType,
  brandName: string,
): WebsiteGenerationOutput {
  const template = getWebsiteTemplate(websiteType);

  return {
    websiteType,
    siteTitle: partial.siteTitle ?? brandName,
    tagline: partial.tagline ?? template.defaultTagline,
    sections: {
      hero: partial.sections?.hero ?? FALLBACK_HERO,
      about: partial.sections?.about ?? FALLBACK_ABOUT,
      services: partial.sections?.services ?? FALLBACK_SERVICES,
      testimonials: partial.sections?.testimonials,
      cta: partial.sections?.cta,
      contact: partial.sections?.contact,
      footer: partial.sections?.footer ?? FALLBACK_FOOTER,
    },
    seo: partial.seo ?? {
      title: `${brandName} | ${template.defaultTagline}`,
      description: `${brandName} — ${template.defaultTagline}`,
      keywords: [brandName.toLowerCase().replace(/\s+/g, "-")],
    },
    styleHints: partial.styleHints ?? {
      tone: "professional",
      style: "modern",
      colorMood: "Clean neutrals with one accent color",
      typographyMood: "Readable sans-serif hierarchy",
    },
  };
}

/**
 * Check whether a partial output has at least the minimum fields required
 * to avoid fallback substitution for key top-level properties.
 */
export function needsFallback(
  partial: Partial<WebsiteGenerationOutput>,
): boolean {
  return Boolean(
    !partial.siteTitle ||
      !partial.tagline ||
      !partial.sections?.hero?.headline ||
      !partial.sections?.hero?.primaryCta ||
      !partial.seo?.title ||
      !partial.seo?.description,
  );
}
