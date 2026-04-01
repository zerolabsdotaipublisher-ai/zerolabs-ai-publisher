/**
 * Navigation structure generation.
 *
 * Derives the primary and footer navigation from the sections present in the
 * generated structure.  Sections that don't belong in navigation (hero, cta,
 * footer) are excluded.  Falls back to template defaults when no navigable
 * sections are found.
 */

import type { WebsiteNavigation, NavigationItem, WebsiteSection, WebsiteType } from "./types";
import { getWebsiteTemplate } from "./templates";

// ---------------------------------------------------------------------------
// Section → nav mapping
// ---------------------------------------------------------------------------

/** Human-readable label for each navigable section type. */
const SECTION_LABELS: Partial<Record<string, string>> = {
  about: "About",
  services: "Services",
  testimonials: "Testimonials",
  contact: "Contact",
};

/** Anchor href for each navigable section type. */
const SECTION_HREFS: Partial<Record<string, string>> = {
  about: "#about",
  services: "#services",
  testimonials: "#testimonials",
  contact: "#contact",
};

/** Section types that are excluded from primary navigation. */
const NAV_EXCLUDED_TYPES = new Set<string>(["hero", "cta", "footer", "custom"]);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a `WebsiteNavigation` from the provided page sections.
 *
 * - Builds primary nav from navigable sections (excludes hero/cta/footer).
 * - Builds footer nav from primary nav plus a "Home" link and copyright.
 * - Falls back to template defaults when no navigable sections are present.
 */
export function generateNavigation(
  websiteType: WebsiteType,
  sections: WebsiteSection[],
  siteTitle: string,
): WebsiteNavigation {
  const primary: NavigationItem[] = [];

  for (const section of sections) {
    if (NAV_EXCLUDED_TYPES.has(section.type) || !section.visible) {
      continue;
    }
    const label = SECTION_LABELS[section.type] ?? capitalise(section.type);
    const href = SECTION_HREFS[section.type] ?? `#${section.type}`;
    primary.push({ label, href });
  }

  // Fall back to template defaults when no navigable sections were found.
  const resolvedPrimary =
    primary.length > 0
      ? primary
      : getWebsiteTemplate(websiteType).defaultPrimaryNav.map((label) => ({
          label,
          href: `#${label.toLowerCase().replace(/\s+/g, "-")}`,
        }));

  const currentYear = new Date().getFullYear();
  const footerCopyright: NavigationItem = {
    label: `© ${currentYear} ${siteTitle}`,
    href: "/",
  };

  const footer: NavigationItem[] = [
    { label: "Home", href: "/" },
    ...resolvedPrimary,
    footerCopyright,
  ];

  return { primary: resolvedPrimary, footer };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
