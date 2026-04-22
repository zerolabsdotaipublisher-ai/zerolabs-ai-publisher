import type {
  WebsiteGenerationInput,
  WebsiteGenerationOutput,
  WebsiteSectionName,
  WebsiteType,
} from "./types";

export const SUPPORTED_WEBSITE_TYPES: WebsiteType[] = [
  "portfolio",
  "small-business",
  "landing-page",
  "personal-brand",
  "blog",
  "article",
];

export const DEFAULT_SECTION_SEQUENCE: WebsiteSectionName[] = [
  "hero",
  "about",
  "services",
  "testimonials",
  "cta",
  "contact",
  "footer",
];

export const OUTPUT_CONTRACT_EXAMPLE: WebsiteGenerationOutput = {
  websiteType: "landing-page",
  siteTitle: "Brand Name",
  tagline: "Clear value proposition",
  sections: {
    hero: {
      headline: "Outcome-driven headline",
      subheadline: "One sentence of support",
      primaryCta: "Start now",
      secondaryCta: "Learn more",
    },
    about: {
      headline: "About",
      body: "Short brand story with proof-oriented language.",
    },
    services: {
      headline: "Services",
      items: [{ name: "Service Name", description: "Outcome and scope." }],
    },
    testimonials: {
      headline: "Client feedback",
      items: [{ quote: "Specific positive outcome.", author: "Client Name" }],
    },
    cta: {
      headline: "Ready to begin?",
      ctaText: "Book a free consultation",
    },
    contact: {
      headline: "Contact",
      channels: [{ label: "email", value: "hello@example.com" }],
    },
    footer: {
      shortBlurb: "One-line brand summary.",
      legalText: "© Brand Name",
    },
  },
  seo: {
    title: "Brand Name | Value Proposition",
    description: "Concise search snippet aligned to page purpose.",
    keywords: ["keyword-a", "keyword-b"],
  },
  styleHints: {
    tone: "professional",
    style: "modern",
    colorMood: "Clean neutrals with one accent color",
    typographyMood: "Readable sans-serif hierarchy",
  },
};

function trimOrUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function sanitizeInput(
  input: WebsiteGenerationInput,
): WebsiteGenerationInput {
  return {
    ...input,
    brandName: input.brandName.trim(),
    description: input.description.trim(),
    targetAudience: input.targetAudience.trim(),
    primaryCta: input.primaryCta.trim(),
    services: input.services.map((service) => service.trim()).filter(Boolean),
    founderProfile: input.founderProfile
      ? {
          name: trimOrUndefined(input.founderProfile.name),
          role: trimOrUndefined(input.founderProfile.role),
          bio: trimOrUndefined(input.founderProfile.bio),
        }
      : undefined,
    testimonials: input.testimonials
      ?.map((testimonial) => ({
        quote: testimonial.quote.trim(),
        author: testimonial.author.trim(),
        role: trimOrUndefined(testimonial.role),
      }))
      .filter((testimonial) => testimonial.quote && testimonial.author),
    contactInfo: input.contactInfo
      ? {
          email: trimOrUndefined(input.contactInfo.email),
          phone: trimOrUndefined(input.contactInfo.phone),
          location: trimOrUndefined(input.contactInfo.location),
          socialLinks: input.contactInfo.socialLinks
            ?.map((link) => link.trim())
            .filter(Boolean),
        }
      : undefined,
    constraints: input.constraints?.map((item) => item.trim()).filter(Boolean),
    customToneNotes: trimOrUndefined(input.customToneNotes),
    customStyleNotes: trimOrUndefined(input.customStyleNotes),
  };
}

export function validateWebsiteGenerationInput(
  input: WebsiteGenerationInput,
): string[] {
  const errors: string[] = [];

  if (!SUPPORTED_WEBSITE_TYPES.includes(input.websiteType)) {
    errors.push("websiteType must be one of the supported website types");
  }

  if (!input.brandName.trim()) {
    errors.push("brandName is required");
  }

  if (!input.description.trim()) {
    errors.push("description is required");
  }

  if (!input.targetAudience.trim()) {
    errors.push("targetAudience is required");
  }

  if (!input.primaryCta.trim()) {
    errors.push("primaryCta is required");
  }

  if (!input.services.length) {
    errors.push("services must include at least one offering");
  }

  return errors;
}

export function outputContractJson(): string {
  return JSON.stringify(OUTPUT_CONTRACT_EXAMPLE, null, 2);
}
