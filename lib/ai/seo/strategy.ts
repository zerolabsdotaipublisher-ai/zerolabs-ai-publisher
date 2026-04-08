import type { PageType } from "../structure/types";

export interface SeoPageStrategy {
  titlePrefix: string;
  intent: string;
  keywordHints: string[];
}

const PAGE_SEO_STRATEGY: Record<PageType, SeoPageStrategy> = {
  home: {
    titlePrefix: "Home",
    intent: "brand-overview",
    keywordHints: ["services", "solutions", "official"],
  },
  about: {
    titlePrefix: "About",
    intent: "credibility",
    keywordHints: ["about", "team", "story"],
  },
  services: {
    titlePrefix: "Services",
    intent: "offer-discovery",
    keywordHints: ["services", "offerings", "pricing"],
  },
  contact: {
    titlePrefix: "Contact",
    intent: "conversion",
    keywordHints: ["contact", "book", "consultation"],
  },
  custom: {
    titlePrefix: "Overview",
    intent: "supporting-page",
    keywordHints: ["details", "information", "resources"],
  },
};

export function getSeoStrategyForPageType(pageType: PageType): SeoPageStrategy {
  return PAGE_SEO_STRATEGY[pageType] ?? PAGE_SEO_STRATEGY.custom;
}
