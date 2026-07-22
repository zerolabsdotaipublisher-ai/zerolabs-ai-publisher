/**
 * Fallback defaults for incomplete or missing AI output.
 *
 * When the AI returns a partial or unparseable response, these defaults
 * ensure the generation pipeline always produces a renderable structure.
 * Fallbacks are keyed by section type and website type, and they use only
 * safe, generic copy that cannot be mistaken for real brand content.
 */

import { getSampleWebsiteProfile, isWeakInputText } from "../default-inputs";
import type { WebsiteGenerationOutput, WebsiteType } from "../prompts/types";
import { getWebsiteTemplate } from "./templates";

function resolveBrandName(websiteType: WebsiteType, brandName: string): string {
  return isWeakInputText(brandName)
    ? getSampleWebsiteProfile(websiteType).brandName
    : brandName.trim();
}

function createFallbackHero(websiteType: WebsiteType, brandName: string) {
  const profile = getSampleWebsiteProfile(websiteType);

  return {
    headline: `${brandName}: ${profile.services[0]}`,
    subheadline: profile.description,
    primaryCta: profile.primaryCta,
  };
}

function createFallbackAbout(websiteType: WebsiteType, brandName: string) {
  const profile = getSampleWebsiteProfile(websiteType);

  return {
    headline: `Why ${brandName}`,
    body: `${brandName} serves ${profile.targetAudience} with a clear offer, practical communication, and work that is easy to act on.`,
  };
}

function createFallbackServices(websiteType: WebsiteType) {
  const profile = getSampleWebsiteProfile(websiteType);

  return {
    headline: "What we offer",
    items: profile.services.map((service) => ({
      name: service,
      description: "Delivered with clear scope, reliable communication, and practical next steps.",
    })),
  };
}

function createFallbackFooter(websiteType: WebsiteType, brandName: string) {
  const profile = getSampleWebsiteProfile(websiteType);

  return {
    shortBlurb: `${brandName} helps ${profile.targetAudience} with practical, high-impact work.`,
  };
}

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
  const safeBrandName = resolveBrandName(websiteType, brandName);
  const profile = getSampleWebsiteProfile(websiteType);

  return {
    websiteType,
    siteTitle: partial.siteTitle ?? safeBrandName,
    tagline: partial.tagline ?? template.defaultTagline,
    sections: {
      hero: partial.sections?.hero ?? createFallbackHero(websiteType, safeBrandName),
      about: partial.sections?.about ?? createFallbackAbout(websiteType, safeBrandName),
      services: partial.sections?.services ?? createFallbackServices(websiteType),
      testimonials: partial.sections?.testimonials,
      cta: partial.sections?.cta,
      contact: partial.sections?.contact,
      footer: partial.sections?.footer ?? createFallbackFooter(websiteType, safeBrandName),
    },
    seo: partial.seo ?? {
      title: `${safeBrandName} | ${template.defaultTagline}`,
      description: `${safeBrandName} - ${profile.description}`,
      keywords: [safeBrandName.toLowerCase().replace(/\s+/g, "-")],
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
