import { resolveWebsiteGenerationInput } from "../default-inputs";
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
  const resolvedInput = resolveWebsiteGenerationInput(input);
  const effectiveInput = resolvedInput.input;
  const provided = effectiveInput.testimonials?.slice(0, 3) ?? [];

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
      audience: effectiveInput.targetAudience,
      tone: effectiveInput.tone,
      density: "medium" as const,
      goal: effectiveInput.primaryCta,
    };
  }

  const sampleItems = resolvedInput.profile.sampleTestimonials.slice(0, 2);

  return {
    variant: sampleItems.length > 1 ? "quote-grid" : "single-quote",
    headline: "Client feedback",
    subheadline: "Representative outcomes from recent work",
    items: sampleItems.map((testimonial) => ({
      quote: testimonial.quote,
      author: testimonial.author,
      role: testimonial.role,
      company: testimonial.company,
      isPlaceholder: true,
    })),
    audience: effectiveInput.targetAudience,
    tone: effectiveInput.tone,
    density: "medium" as const,
    goal: effectiveInput.primaryCta,
  };
}

function fallbackContact(input: WebsiteGenerationInput) {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;
  const channels = [
    resolvedInput.contactInfo?.email
      ? { label: "Email", value: resolvedInput.contactInfo.email }
      : null,
    resolvedInput.contactInfo?.phone
      ? { label: "Phone", value: resolvedInput.contactInfo.phone }
      : null,
    resolvedInput.contactInfo?.location
      ? { label: "Location", value: resolvedInput.contactInfo.location }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return {
    headline: "Contact",
    subheadline: "Tell us what you need and we will map next steps quickly.",
    channels:
      channels.length > 0
        ? channels
        : [{ label: "Availability", value: "Available by appointment and responsive by email." }],
    helperText: "Response within one business day.",
  };
}

export function createFooterFallback(input: WebsiteGenerationInput) {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    shortBlurb: `${resolvedInput.brandName} helps ${resolvedInput.targetAudience} with practical, high-impact work.`,
    legalText: `Copyright ${new Date().getFullYear()} ${resolvedInput.brandName}`,
    trustIndicators: ["Privacy-minded", "No inflated promises"],
  };
}

export function createFallbackPageContent(
  page: PageGenerationContext,
  input: WebsiteGenerationInput,
  allowedSections?: ContentSectionType[],
): GeneratedPageContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;
  const hero = normalizeHeroSectionContent(undefined, resolvedInput);
  const about = normalizeInformationalSection(undefined, createAboutFallback(resolvedInput));
  const services = normalizeServicesSection(undefined, resolvedInput);

  const sections: GeneratedPageContent["sections"] = {};
  if (sectionRequested("hero", allowedSections)) sections.hero = hero;
  if (sectionRequested("about", allowedSections)) sections.about = about;
  if (sectionRequested("services", allowedSections)) sections.services = services;
  if (sectionRequested("features", allowedSections)) {
    sections.features = normalizeInformationalSection(
      undefined,
      createInformationalFallback("Key features", resolvedInput),
    );
  }
  if (sectionRequested("process", allowedSections)) {
    sections.process = normalizeInformationalSection(
      undefined,
      createInformationalFallback("How it works", resolvedInput),
    );
  }
  if (sectionRequested("benefits", allowedSections)) {
    sections.benefits = normalizeInformationalSection(
      undefined,
      createInformationalFallback("Benefits", resolvedInput),
    );
  }
  if (sectionRequested("testimonials", allowedSections)) {
    sections.testimonials = fallbackTestimonials(resolvedInput);
  }
  if (sectionRequested("faq", allowedSections)) {
    sections.faq = {
      variant: "expanded",
      headline: "Frequently asked questions",
      subheadline: `Answers for ${resolvedInput.targetAudience} before they commit.`,
      items: [
        {
          question: "How do we get started?",
          answer: "Start with a short discovery call and we will define scope, priorities, and outcomes together.",
        },
        {
          question: "What does engagement look like?",
          answer: "Clear milestones, transparent communication, and practical deliverables that keep momentum visible.",
        },
      ],
      audience: resolvedInput.targetAudience,
      tone: resolvedInput.tone,
      density: "medium",
      goal: resolvedInput.primaryCta,
    };
  }
  if (sectionRequested("cta", allowedSections)) {
    sections.cta = normalizeCtaSection(createCtaFallback(resolvedInput), resolvedInput);
  }
  if (sectionRequested("pricing", allowedSections)) {
    sections.pricing = normalizePricingSection(createPricingFallback(resolvedInput), resolvedInput);
  }
  if (sectionRequested("contact", allowedSections)) {
    sections.contact = fallbackContact(resolvedInput);
  }
  if (sectionRequested("footer", allowedSections)) {
    sections.footer = createFooterFallback(resolvedInput);
  }
  if (sectionRequested("microcopy", allowedSections)) {
    sections.microcopy = normalizeMicrocopy(createMicrocopyFallback(resolvedInput), resolvedInput);
  }

  return {
    pageSlug: page.pageSlug,
    pageType: page.pageType,
    messaging: {
      pageHeadline: hero.headline,
      pageSubheadline: hero.subheadline,
      valueProposition: resolvedInput.description,
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
