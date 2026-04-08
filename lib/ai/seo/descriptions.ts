import type { SeoGenerationContextPage } from "./types";

const MAX_DESCRIPTION_LENGTH = 160;

function clampDescription(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`;
}

export function createFallbackPageDescription(
  brandName: string,
  page: Pick<SeoGenerationContextPage, "pageTitle" | "sectionHeadlines">,
): string {
  const primarySection = page.sectionHeadlines[0] || "services";
  return clampDescription(
    `${brandName} ${page.pageTitle.toLowerCase()} page covering ${primarySection.toLowerCase()} and practical next steps.`,
  );
}

export function normalizeSeoDescription(description: string, fallback: string): string {
  const candidate = description.trim();
  return clampDescription(candidate || fallback);
}
