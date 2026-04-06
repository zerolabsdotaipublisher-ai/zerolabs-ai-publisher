import type { PageType, SectionType, WebsiteSection } from "../structure/types";

const ORDER_RULES: Record<PageType, SectionType[]> = {
  home: ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "custom"],
  about: ["hero", "about", "testimonials", "cta", "footer", "services", "contact", "custom"],
  services: ["hero", "services", "testimonials", "cta", "contact", "footer", "about", "custom"],
  contact: ["contact", "hero", "services", "cta", "footer", "about", "testimonials", "custom"],
  custom: ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "custom"],
};

function sectionRank(type: SectionType, pageType: PageType): number {
  const order = ORDER_RULES[pageType] ?? ORDER_RULES.custom;
  const index = order.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function orderSectionsByPageType(
  sections: WebsiteSection[],
  pageType: PageType,
): WebsiteSection[] {
  return [...sections].sort((a, b) => {
    const rankDiff = sectionRank(a.type, pageType) - sectionRank(b.type, pageType);
    if (rankDiff !== 0) return rankDiff;
    return a.order - b.order;
  });
}

export function orderSectionsWithCustomIds(
  sections: WebsiteSection[],
  orderedIds: string[],
): WebsiteSection[] {
  if (!orderedIds.length) return sections;

  const idRank = new Map<string, number>();
  orderedIds.forEach((id, idx) => idRank.set(id, idx));

  return [...sections].sort((a, b) => {
    const aRank = idRank.get(a.id);
    const bRank = idRank.get(b.id);

    if (aRank !== undefined && bRank !== undefined) {
      return aRank - bRank;
    }
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;
    return a.order - b.order;
  });
}
