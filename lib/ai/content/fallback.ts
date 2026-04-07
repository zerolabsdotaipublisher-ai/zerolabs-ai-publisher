import type { WebsiteGenerationInput } from "../prompts/types";
import type {
  ContentDensityPreset,
  ContentLengthPreset,
  GeneratedPageContent,
  PageGenerationContext,
  WebsiteContentPackage,
} from "./types";
import { createCtaFallback, normalizeCtaSection } from "./cta";
import { createHeroFallback, normalizeHeroSectionContent } from "./hero";
import {
  createAboutFallback,
  createInformationalFallback,
  createServicesFallback,
  normalizeInformationalSection,
  normalizeServicesSection,
} from "./informational";
import { createMicrocopyFallback, normalizeMicrocopy } from "./microcopy";

function fallbackTestimonials(input: WebsiteGenerationInput) {
  const provided = input.testimonials?.slice(0, 3) ?? [];

  if (provided.length > 0) {
    return {
      headline: "Client feedback",
      subheadline: "Results from real engagements",
      items: provided.map((testimonial) => ({
        quote: testimonial.quote,
        author: testimonial.author,
        role: testimonial.role,
        isPlaceholder: false,
      })),
    };
  }

  return {
    headline: "Client feedback",
    subheadline: "Representative outcomes",
    items: [
      {
        quote: "Clear process and strong communication from start to finish.",
        author: "Example Client",
        role: "Placeholder testimonial",
        isPlaceholder: true,
      },
    ],
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

function fallbackFooter(input: WebsiteGenerationInput) {
  return {
    shortBlurb: `${input.brandName} helps ${input.targetAudience} with practical, high-impact work.`,
    legalText: `© ${new Date().getFullYear()} ${input.brandName}`,
    trustIndicators: ["Privacy-minded", "No inflated promises"],
  };
}

export function createFallbackPageContent(
  page: PageGenerationContext,
  input: WebsiteGenerationInput,
): GeneratedPageContent {
  const hero = normalizeHeroSectionContent(undefined, input);
  const about = normalizeInformationalSection(undefined, createAboutFallback(input));
  const services = normalizeServicesSection(undefined, input);

  return {
    pageSlug: page.pageSlug,
    pageType: page.pageType,
    messaging: {
      pageHeadline: hero.headline,
      pageSubheadline: hero.subheadline,
      valueProposition: input.description,
    },
    sections: {
      hero,
      about,
      services,
      features: normalizeInformationalSection(
        undefined,
        createInformationalFallback("Key features", input),
      ),
      process: normalizeInformationalSection(
        undefined,
        createInformationalFallback("How it works", input),
      ),
      benefits: normalizeInformationalSection(
        undefined,
        createInformationalFallback("Benefits", input),
      ),
      testimonials: fallbackTestimonials(input),
      faq: {
        headline: "Frequently asked questions",
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
      },
      cta: normalizeCtaSection(createCtaFallback(input), input),
      contact: fallbackContact(input),
      footer: fallbackFooter(input),
      microcopy: normalizeMicrocopy(createMicrocopyFallback(input), input),
    },
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
    pages: pages.map((page) => createFallbackPageContent(page, input)),
    generatedFromInput: input,
    generatedAt: now,
    updatedAt: now,
    version,
  };
}
