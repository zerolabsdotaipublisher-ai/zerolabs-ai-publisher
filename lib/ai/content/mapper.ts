import { generatePageLayouts } from "../layout";
import type { WebsiteSection, WebsiteStructure } from "../structure/types";
import type {
  GeneratedPageContent,
  GeneratedSectionContentMap,
  PageGenerationContext,
  WebsiteContentPackage,
} from "./types";

function sectionMapForPage(page: GeneratedPageContent): GeneratedSectionContentMap {
  return page.sections;
}

function mapSectionContent(
  section: WebsiteSection,
  generated: GeneratedSectionContentMap,
): WebsiteSection {
  switch (section.type) {
    case "hero": {
      const hero = generated.hero;
      if (!hero) return section;
      return {
        ...section,
        content: {
          headline: hero.headline,
          subheadline: hero.subheadline,
          primaryCta: hero.primaryCta,
          secondaryCta: hero.secondaryCta,
          supportingCopy: hero.supportingCopy,
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
          body: about.paragraphs.join(" "),
          paragraphs: about.paragraphs,
          bullets: about.bullets,
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
          items: services.items.map((item) => ({
            name: item.name,
            description: item.description,
          })),
          bullets: services.bullets,
          paragraphs: services.paragraphs,
        },
      };
    }
    case "testimonials": {
      const testimonials = generated.testimonials;
      if (!testimonials) return section;
      return {
        ...section,
        content: {
          headline: testimonials.headline,
          subheadline: testimonials.subheadline,
          items: testimonials.items.map((item) => ({
            quote: item.quote,
            author: item.author,
            role: item.role,
          })),
        },
      };
    }
    case "cta": {
      const cta = generated.cta;
      if (!cta) return section;
      return {
        ...section,
        content: {
          headline: cta.headline,
          subheadline: cta.supportingLine,
          ctaText: cta.ctaText,
          urgencyLabel: cta.urgencyLabel,
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

    return {
      ...page,
      title: generatedPage.messaging.pageHeadline,
      sections: page.sections.map((section) => mapSectionContent(section, mappedSections)),
    };
  });

  const updatedStructure: WebsiteStructure = {
    ...structure,
    pages: updatedPages,
    updatedAt: new Date().toISOString(),
  };

  const layoutResult = generatePageLayouts(updatedStructure);
  updatedStructure.layout = layoutResult.layout;

  return updatedStructure;
}

export function resolvePageGenerationContexts(
  structure: WebsiteStructure,
): PageGenerationContext[] {
  const contexts = structure.pages.map((page) => ({
    pageSlug: page.slug,
    pageType: page.type,
    sections: page.sections.map((section) => section.type),
  }));

  const existing = new Set(contexts.map((context) => context.pageSlug));
  const defaults: PageGenerationContext[] = [
    { pageSlug: "/", pageType: "home", sections: ["hero", "about", "services", "cta", "contact", "footer", "microcopy"] },
    { pageSlug: "/about", pageType: "about", sections: ["hero", "about", "benefits", "testimonials", "cta", "footer", "microcopy"] },
    { pageSlug: "/services", pageType: "services", sections: ["hero", "services", "features", "process", "cta", "contact", "footer", "microcopy"] },
    { pageSlug: "/contact", pageType: "contact", sections: ["hero", "contact", "faq", "cta", "footer", "microcopy"] },
  ];

  defaults.forEach((defaultPage) => {
    if (!existing.has(defaultPage.pageSlug)) {
      contexts.push(defaultPage);
    }
  });

  return contexts;
}
