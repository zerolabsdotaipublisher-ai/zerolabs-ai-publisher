import type { SectionType, WebsitePage, WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import { reorderById, setValueByPath } from "./mapping";

const REQUIRED_SECTION_TYPES: SectionType[] = ["hero"];

function createSectionContent(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { headline: "New headline", subheadline: "Add a supporting subheadline", primaryCta: "Get started" };
    case "about":
      return { headline: "About", body: "Describe your business." };
    case "services":
      return { headline: "Services", items: [{ name: "Service name", description: "Service description" }] };
    case "testimonials":
      return { headline: "Testimonials", items: [{ quote: "Great service.", author: "Customer" }] };
    case "cta":
      return { headline: "Ready to start?", ctaText: "Contact us" };
    case "contact":
      return { headline: "Contact", channels: [{ label: "Email", value: "hello@example.com" }] };
    case "footer":
      return { shortBlurb: "Short summary", legalText: "© All rights reserved." };
    default:
      return { headline: "Custom section", body: "Add your custom content." };
  }
}

function nextSectionOrder(page: WebsitePage): number {
  if (page.sections.length === 0) {
    return 1;
  }

  return Math.max(...page.sections.map((section) => section.order)) + 1;
}

function createSectionId(pageId: string, type: SectionType): string {
  return `${pageId}_${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addSectionToPage(page: WebsitePage, type: SectionType): WebsitePage {
  const nextSection: WebsiteSection = {
    id: createSectionId(page.id, type),
    type,
    order: nextSectionOrder(page),
    visible: true,
    content: createSectionContent(type),
  };

  return {
    ...page,
    sections: [...page.sections, nextSection],
  };
}

export function removeSectionFromPage(page: WebsitePage, sectionId: string): WebsitePage {
  const section = page.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    return page;
  }

  if (REQUIRED_SECTION_TYPES.includes(section.type)) {
    const sameTypeCount = page.sections.filter((candidate) => candidate.type === section.type).length;
    if (sameTypeCount <= 1) {
      return page;
    }
  }

  const remaining = page.sections.filter((candidate) => candidate.id !== sectionId);

  return {
    ...page,
    sections: remaining
      .sort((left, right) => left.order - right.order)
      .map((candidate, index) => ({ ...candidate, order: index + 1 })),
  };
}

export function reorderPageSections(page: WebsitePage, sectionOrder: string[]): WebsitePage {
  const expectedIds = new Set(page.sections.map((section) => section.id));
  const nextIds = new Set(sectionOrder);

  if (expectedIds.size !== nextIds.size || !Array.from(expectedIds).every((id) => nextIds.has(id))) {
    return page;
  }

  return {
    ...page,
    sections: reorderById(page.sections, sectionOrder),
  };
}

export function updateSectionVisibility(page: WebsitePage, sectionId: string, visible: boolean): WebsitePage {
  return {
    ...page,
    sections: page.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            visible,
          }
        : section,
    ),
  };
}

export function updateSectionTextValue(section: WebsiteSection, path: string, value: string): WebsiteSection {
  return setValueByPath(section, path, value);
}

export function updateStructurePage(structure: WebsiteStructure, pageId: string, updater: (page: WebsitePage) => WebsitePage): WebsiteStructure {
  return {
    ...structure,
    pages: structure.pages.map((page) => (page.id === pageId ? updater(page) : page)),
  };
}
