import type { WebsiteGenerationInput } from "../prompts/types";
import type {
  ContentSectionType,
  ContentDensityPreset,
  ContentLengthPreset,
  GeneratedPageContent,
  PageGenerationContext,
  TestimonialsSectionContent,
  WebsiteContentPackage,
} from "./types";
import { createCtaFallback, normalizeCtaSection } from "./cta";
import { normalizeHeroSectionContent } from "./hero";
import {
  createAboutFallback,
  createInformationalFallback,
  normalizeInformationalSection,
  normalizeServicesSection,
} from "./informational";
import { createMicrocopyFallback, normalizeMicrocopy } from "./microcopy";
import { createPricingFallback, normalizePricingSection } from "./pricing";

function sectionRequested(
  sectionType: ContentSectionType,
  allowedSections?: ContentSectionType[],
): boolean {
  return !allowedSections?.length || allowedSections.includes(sectionType);
}

function fallbackTestimonials(input: WebsiteGenerationInput): TestimonialsSectionContent {
  const provided = input.testimonials?.slice(0, 3) ?? [];

  if (provided.length > 0) {
    return {
      variant: provided.length > 1 ? "quote-grid" : "single-quote",
      headline: "Client feedback",
      subheadline: "Results from real engagements",
      items: provided.map((testimonial) => ({
        quote: testimonial.quote,
        author: testimonial.author,
        role: testimonial.role,
        isPlaceholder: false,
      })),
      audience: input.targetAudience,
      tone: input.tone,
      density: "medium" as const,
      goal: input.primaryCta,
    };
  }

  return {
    variant: "quote-grid",
    headline: "Client feedback",
    subheadline: "Representative outcomes",
    items: [
      {
        quote: "Clear process and strong communication from start to finish.",
        author: "Example Client",
        role: "Placeholder testimonial",
        company: "Synthetic social proof",
        isPlaceholder: true,
      },
    ],
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium" as const,
    goal: input.primaryCta,
  };
}

function fallbackContact(input: WebsiteGenerationInput) {
  const channels = [
    input.contactInfo?.email
      ? { label: "Email", value: input.contactInfo.email }
      : null,
    input.contactInfo?.phone
      ? { label: "Phone", value: input.contactInfo.phone }
      : null,
    input.contactInfo?.location
      ? { label: "Location", value: input.contactInfo.location }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return {
    headline: "Contact",
    subheadline: `Tell us what you need and we'll map next steps quickly.`,
    channels: channels.length > 0 ? channels : [{ label: "Email", value: "hello@example.com" }],
    helperText: "Response within one business day.",
  };
}

export function createFooterFallback(input: WebsiteGenerationInput) {
  return {
    shortBlurb: `${input.brandName} helps ${input.targetAudience} with practical, high-impact work.`,
    legalText: `© ${new Date().getFullYear()} ${input.brandName}`,
    trustIndicators: ["Privacy-minded", "No inflated promises"],
  };
}

export function createFallbackPageContent(
  page: PageGenerationContext,
  input: WebsiteGenerationInput,
  allowedSections?: ContentSectionType[],
): GeneratedPageContent {
  const hero = normalizeHeroSectionContent(undefined, input);
  const about = normalizeInformationalSection(undefined, createAboutFallback(input));
  const services = normalizeServicesSection(undefined, input);

  const sections: GeneratedPageContent["sections"] = {};
  if (sectionRequested("hero", allowedSections)) sections.hero = hero;
  if (sectionRequested("about", allowedSections)) sections.about = about;
  if (sectionRequested("services", allowedSections)) sections.services = services;
  if (sectionRequested("features", allowedSections)) {
    sections.features = normalizeInformationalSection(
      undefined,
      createInformationalFallback("Key features", input),
    );
  }
  if (sectionRequested("process", allowedSections)) {
    sections.process = normalizeInformationalSection(
      undefined,
      createInformationalFallback("How it works", input),
    );
  }
  if (sectionRequested("benefits", allowedSections)) {
    sections.benefits = normalizeInformationalSection(
      undefined,
      createInformationalFallback("Benefits", input),
    );
  }
  if (sectionRequested("testimonials", allowedSections)) {
    sections.testimonials = fallbackTestimonials(input);
  }
  if (sectionRequested("faq", allowedSections)) {
    sections.faq = {
      variant: "expanded",
      headline: "Frequently asked questions",
      subheadline: `Answers for ${input.targetAudience} before they commit.`,
      items: [
        {
          question: "How do we get started?",
          answer: "Start with a short discovery call and we will define scope and outcomes.",
        },
        {
          question: "What does engagement look like?",
          answer: "Clear milestones, transparent communication, and practical deliverables.",
        },
      ],
      audience: input.targetAudience,
      tone: input.tone,
      density: "medium",
      goal: input.primaryCta,
    };
  }
  if (sectionRequested("cta", allowedSections)) {
    sections.cta = normalizeCtaSection(createCtaFallback(input), input);
  }
  if (sectionRequested("pricing", allowedSections)) {
    sections.pricing = normalizePricingSection(createPricingFallback(input), input);
  }
  if (sectionRequested("contact", allowedSections)) {
    sections.contact = fallbackContact(input);
  }
  if (sectionRequested("footer", allowedSections)) {
    sections.footer = createFooterFallback(input);
  }
  if (sectionRequested("microcopy", allowedSections)) {
    sections.microcopy = normalizeMicrocopy(createMicrocopyFallback(input), input);
  }

  return {
    pageSlug: page.pageSlug,
    pageType: page.pageType,
    messaging: {
      pageHeadline: hero.headline,
      pageSubheadline: hero.subheadline,
      valueProposition: input.description,
    },
    sections,
  };
}

function generateContentId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `wc_${ts}_${rnd}`;
}

export function createFallbackWebsiteContentPackage(
  structureId: string,
  userId: string,
  websiteType: WebsiteGenerationInput["websiteType"],
  input: WebsiteGenerationInput,
  pages: PageGenerationContext[],
  lengthPreset: ContentLengthPreset,
  densityPreset: ContentDensityPreset,
  sectionTypes?: ContentSectionType[],
  version = 1,
): WebsiteContentPackage {
  const now = new Date().toISOString();

  return {
    id: generateContentId(),
    structureId,
    userId,
    websiteType,
    tone: input.tone,
    style: input.style,
    lengthPreset,
    densityPreset,
    pages: pages.map((page) => createFallbackPageContent(page, input, sectionTypes)),
    generatedFromInput: input,
    generatedAt: now,
    updatedAt: now,
    version,
  };
}
