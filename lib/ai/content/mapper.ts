import { generatePageLayouts } from "../layout";
import { generateNavigation } from "../structure/navigation";
import type { SectionType, WebsiteSection, WebsiteStructure } from "../structure/types";
import type {
  ContentSectionType,
  GeneratedPageContent,
  GeneratedSectionContentMap,
  PageGenerationContext,
  WebsiteContentPackage,
} from "./types";

function isContentSectionType(value: string): value is ContentSectionType {
  return value !== "custom";
}

function isStructureSectionType(value: string): value is SectionType {
  return value !== "microcopy" && value !== "process";
}

function sectionMapForPage(page: GeneratedPageContent): Partial<GeneratedSectionContentMap> {
  return page.sections;
}

function generateSectionId(pageId: string, sectionType: SectionType): string {
  if (globalThis.crypto?.randomUUID) {
    return `${pageId}_${sectionType}_${globalThis.crypto.randomUUID()}`;
  }

  return `${pageId}_${sectionType}_${Date.now().toString(36)}`;
}

function desiredStructureSectionOrder(
  pageSections: Partial<GeneratedSectionContentMap>,
): SectionType[] {
  const orderedTypes: Array<Exclude<SectionType, "custom">> = [
    "hero",
    "about",
    "services",
    "features",
    "benefits",
    "testimonials",
    "pricing",
    "faq",
    "cta",
    "contact",
    "footer",
  ];

  return orderedTypes.filter((type) => pageSections[type] !== undefined);
}

function ensureStructureSections(
  page: WebsiteStructure["pages"][number],
  generatedPage: GeneratedPageContent,
): WebsiteSection[] {
  const byType = new Map(page.sections.map((section) => [section.type, section]));
  const orderedTypes = desiredStructureSectionOrder(generatedPage.sections);

  const ensured = orderedTypes.map((type, index) => {
    const existing = byType.get(type);
    if (existing) {
      return {
        ...existing,
        order: index,
      };
    }

    return {
      id: generateSectionId(page.id, type),
      type,
      order: index,
      visible: true,
      content: {},
    } satisfies WebsiteSection;
  });

  const customSections = page.sections
    .filter((section) => section.type === "custom")
    .map((section, index) => ({
      ...section,
      order: ensured.length + index,
    }));

  return [...ensured, ...customSections];
}

const DEFAULT_PAGE_CONTEXTS: PageGenerationContext[] = [
  {
    pageSlug: "/",
    pageType: "home",
    sections: [
      "hero",
      "about",
      "services",
      "features",
      "testimonials",
      "cta",
      "contact",
      "footer",
      "microcopy",
    ],
  },
  {
    pageSlug: "/about",
    pageType: "about",
    sections: [
      "hero",
      "about",
      "benefits",
      "testimonials",
      "faq",
      "cta",
      "footer",
      "microcopy",
    ],
  },
  {
    pageSlug: "/services",
    pageType: "services",
    sections: [
      "hero",
      "services",
      "features",
      "process",
      "benefits",
      "cta",
      "contact",
      "footer",
      "microcopy",
    ],
  },
  {
    pageSlug: "/pricing",
    pageType: "custom",
    sections: ["hero", "pricing", "faq", "cta", "footer", "microcopy"],
  },
  {
    pageSlug: "/contact",
    pageType: "contact",
    sections: ["hero", "contact", "faq", "cta", "footer", "microcopy"],
  },
];

function mapSectionContent(
  section: WebsiteSection,
  generated: Partial<GeneratedSectionContentMap>,
): WebsiteSection {
  switch (section.type) {
    case "hero": {
      const hero = generated.hero;
      if (!hero) return section;
      return {
        ...section,
        content: {
          variant: hero.variant,
          eyebrow: hero.eyebrow,
          headline: hero.headline,
          subheadline: hero.subheadline,
          primaryCta: hero.primaryCta,
          secondaryCta: hero.secondaryCta,
          supportingCopy: hero.supportingCopy,
          ctaHref: hero.ctaHref,
          image: hero.image,
        },
      };
    }
    case "about": {
      const about = generated.about;
      if (!about) return section;
      return {
        ...section,
        content: {
          headline: about.headline,
          subheadline: about.subheadline,
          description: about.description,
          body: about.paragraphs.join(" "),
          paragraphs: about.paragraphs,
          bullets: about.bullets,
          items: about.items,
          variant: about.variant,
        },
      };
    }
    case "services": {
      const services = generated.services;
      if (!services) return section;
      return {
        ...section,
        content: {
          headline: services.headline,
          subheadline: services.subheadline,
          description: services.description,
          variant: services.variant,
          items: services.items.map((item) => ({
            name: item.name,
            description: item.description,
            descriptor: item.descriptor,
          })),
          bullets: services.bullets,
          paragraphs: services.paragraphs,
        },
      };
    }
    case "features": {
      const features = generated.features;
      if (!features) return section;
      return {
        ...section,
        content: {
          variant: features.variant,
          headline: features.headline,
          subheadline: features.subheadline,
          description: features.description,
          paragraphs: features.paragraphs,
          bullets: features.bullets,
          items: features.items,
        },
      };
    }
    case "benefits": {
      const benefits = generated.benefits;
      if (!benefits) return section;
      return {
        ...section,
        content: {
          variant: benefits.variant,
          headline: benefits.headline,
          subheadline: benefits.subheadline,
          description: benefits.description,
          paragraphs: benefits.paragraphs,
          bullets: benefits.bullets,
          items: benefits.items,
        },
      };
    }
    case "testimonials": {
      const testimonials = generated.testimonials;
      if (!testimonials) return section;
      return {
        ...section,
        content: {
          variant: testimonials.variant,
          headline: testimonials.headline,
          subheadline: testimonials.subheadline,
          items: testimonials.items.map((item) => ({
            quote: item.quote,
            author: item.author,
            role: item.role,
            company: item.company,
            isPlaceholder: item.isPlaceholder,
          })),
        },
      };
    }
    case "faq": {
      const faq = generated.faq;
      if (!faq) return section;
      return {
        ...section,
        content: {
          variant: faq.variant,
          headline: faq.headline,
          subheadline: faq.subheadline,
          items: faq.items,
        },
      };
    }
    case "cta": {
      const cta = generated.cta;
      if (!cta) return section;
      return {
        ...section,
        content: {
          variant: cta.variant,
          headline: cta.headline,
          subheadline: cta.supportingLine,
          ctaText: cta.ctaText,
          ctaHref: cta.ctaHref,
          secondaryCtaText: cta.secondaryCtaText,
          secondaryCtaHref: cta.secondaryCtaHref,
          urgencyLabel: cta.urgencyLabel,
        },
      };
    }
    case "pricing": {
      const pricing = generated.pricing;
      if (!pricing) return section;
      return {
        ...section,
        content: {
          variant: pricing.variant,
          headline: pricing.headline,
          subheadline: pricing.subheadline,
          tiers: pricing.tiers,
          guaranteeLine: pricing.guaranteeLine,
          disclaimer: pricing.disclaimer,
        },
      };
    }
    case "contact": {
      const contact = generated.contact;
      if (!contact) return section;
      return {
        ...section,
        content: {
          headline: contact.headline,
          subheadline: contact.subheadline,
          channels: contact.channels,
          helperText: contact.helperText,
        },
      };
    }
    case "footer": {
      const footer = generated.footer;
      if (!footer) return section;
      return {
        ...section,
        content: {
          shortBlurb: footer.shortBlurb,
          legalText: footer.legalText,
          trustIndicators: footer.trustIndicators,
        },
      };
    }
    default:
      return section;
  }
}

export function applyGeneratedContentToStructure(
  structure: WebsiteStructure,
  content: WebsiteContentPackage,
): WebsiteStructure {
  const updatedPages = structure.pages.map((page) => {
    const generatedPage = content.pages.find((candidate) => candidate.pageSlug === page.slug);

    if (!generatedPage) {
      return page;
    }

    const mappedSections = sectionMapForPage(generatedPage);
    const ensuredSections = ensureStructureSections(page, generatedPage);

    return {
      ...page,
      title: generatedPage.messaging.pageHeadline,
      sections: ensuredSections.map((section) =>
        isStructureSectionType(section.type) ? mapSectionContent(section, mappedSections) : section,
      ),
    };
  });

  const updatedStructure: WebsiteStructure = {
    ...structure,
    pages: updatedPages,
    navigation: generateNavigation(structure.websiteType, updatedPages, structure.siteTitle),
    updatedAt: new Date().toISOString(),
  };

  const layoutResult = generatePageLayouts(updatedStructure);
  updatedStructure.layout = layoutResult.layout;

  return updatedStructure;
}

export function resolvePageGenerationContexts(
  structure: WebsiteStructure,
): PageGenerationContext[] {
  const contexts: PageGenerationContext[] = structure.pages.map((page) => {
    const sections = page.sections.reduce<ContentSectionType[]>(
      (acc, section) => {
        if (isContentSectionType(section.type)) {
          acc.push(section.type);
        }
        return acc;
      },
      [],
    );

    return {
      pageSlug: page.slug,
      pageType: page.type,
      sections,
    };
  });

  const existing = new Set(contexts.map((context) => context.pageSlug));
  DEFAULT_PAGE_CONTEXTS.forEach((defaultPage) => {
    if (!existing.has(defaultPage.pageSlug)) {
      contexts.push(defaultPage);
    }
  });

  return contexts;
}
