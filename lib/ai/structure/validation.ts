/**
 * Website structure validation — render-readiness checks.
 *
 * This module exposes the schema validators from schemas.ts plus an
 * additional render-readiness check that confirms a structure has the minimum
 * fields required for the frontend renderer to produce a meaningful page.
 */

import type { WebsiteStructure } from "./types";

export { validateWebsiteStructure, isValidStructure } from "./schemas";

/**
 * Returns true when the structure has the minimum fields required to render
 * a meaningful page without encountering undefined-access errors.
 *
 * This is a looser check than `isValidStructure` — it is used post-generation
 * to decide whether a fallback warning should be surfaced to the user.
 */
export function hasMinimumRenderableStructure(
  structure: Partial<WebsiteStructure>,
): boolean {
  if (!structure.siteTitle?.trim() || !structure.tagline?.trim()) {
    return false;
  }
  if (!structure.pages || structure.pages.length === 0) {
    return false;
  }
  const homePage = structure.pages[0];
  if (!homePage?.sections || homePage.sections.length === 0) {
    return false;
  }
  const heroSection = homePage.sections.find((s) => s.type === "hero");
  if (!heroSection) {
    return false;
  }
  const content = heroSection.content as {
    headline?: unknown;
    primaryCta?: unknown;
  };
  return (
    typeof content.headline === "string" &&
    content.headline.trim().length > 0 &&
    typeof content.primaryCta === "string" &&
    content.primaryCta.trim().length > 0
  );
}
