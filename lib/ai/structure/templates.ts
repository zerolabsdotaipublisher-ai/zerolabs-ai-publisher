/**
 * Default templates for each website type.
 *
 * Templates define the canonical section ordering, page title defaults, and
 * fallback taglines used when AI output is absent or incomplete.  They are the
 * authoritative source of structure defaults for the generation pipeline and
 * are also used by the fallback module.
 */

import type { WebsiteType, SectionType } from "./types";

// ---------------------------------------------------------------------------
// Template interface
// ---------------------------------------------------------------------------

export interface WebsiteTemplate {
  /** Website type this template applies to. */
  websiteType: WebsiteType;
  /** Canonical ordered list of sections for this type. */
  defaultSections: SectionType[];
  /** Default home-page title. */
  defaultPageTitle: string;
  /** Fallback tagline used when AI output is absent. */
  defaultTagline: string;
  /** Primary navigation labels (derived from sections). */
  defaultPrimaryNav: string[];
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

const TEMPLATES: Record<WebsiteType, WebsiteTemplate> = {
  portfolio: {
    websiteType: "portfolio",
    defaultSections: [
      "hero",
      "about",
      "services",
      "testimonials",
      "contact",
      "footer",
    ],
    defaultPageTitle: "Portfolio",
    defaultTagline: "Creative work that speaks for itself.",
    defaultPrimaryNav: ["About", "Work", "Contact"],
  },

  "small-business": {
    websiteType: "small-business",
    defaultSections: [
      "hero",
      "services",
      "about",
      "testimonials",
      "cta",
      "contact",
      "footer",
    ],
    defaultPageTitle: "Home",
    defaultTagline: "Your trusted local business.",
    defaultPrimaryNav: ["Services", "About", "Contact"],
  },

  "landing-page": {
    websiteType: "landing-page",
    defaultSections: ["hero", "services", "testimonials", "cta", "footer"],
    defaultPageTitle: "Home",
    defaultTagline: "The fastest way to get started.",
    defaultPrimaryNav: ["Features", "Pricing", "Sign Up"],
  },

  "personal-brand": {
    websiteType: "personal-brand",
    defaultSections: [
      "hero",
      "about",
      "services",
      "testimonials",
      "cta",
      "contact",
      "footer",
    ],
    defaultPageTitle: "Home",
    defaultTagline: "Helping you do your best work.",
    defaultPrimaryNav: ["About", "Services", "Contact"],
  },
  blog: {
    websiteType: "blog",
    defaultSections: ["hero", "custom", "footer"],
    defaultPageTitle: "Blog",
    defaultTagline: "Structured articles ready for preview and publishing.",
    defaultPrimaryNav: ["Blog"],
  },
};

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/**
 * Return the template for the given website type.
 * Always returns a valid template (all types are covered by TEMPLATES).
 */
export function getWebsiteTemplate(websiteType: WebsiteType): WebsiteTemplate {
  return TEMPLATES[websiteType];
}

/**
 * Return all website templates as an array.
 */
export function getAllTemplates(): WebsiteTemplate[] {
  return Object.values(TEMPLATES);
}
