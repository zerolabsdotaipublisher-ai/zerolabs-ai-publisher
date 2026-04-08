import { getSeoStrategyForPageType } from "./strategy";
import type { SeoGenerationContextPage } from "./types";

const MAX_TITLE_LENGTH = 60;

function clampTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

export function createFallbackPageTitle(
  brandName: string,
  page: Pick<SeoGenerationContextPage, "pageType" | "pageTitle">,
): string {
  const strategy = getSeoStrategyForPageType(page.pageType);

  if (page.pageType === "home") {
    return clampTitle(`${brandName} | ${strategy.keywordHints[0]}`);
  }

  return clampTitle(`${strategy.titlePrefix} | ${brandName}`);
}

export function normalizeSeoTitle(title: string, fallback: string): string {
  const candidate = title.trim();
  return clampTitle(candidate || fallback);
}
