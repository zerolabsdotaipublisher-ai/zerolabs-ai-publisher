import type {
  GeneratedPageContent,
  WebsiteContentPackage,
  ContentLengthPreset,
  ContentDensityPreset,
  PageGenerationContext,
} from "./types";

export const DEFAULT_LENGTH_PRESET: ContentLengthPreset = "balanced";
export const DEFAULT_DENSITY_PRESET: ContentDensityPreset = "medium";

export const CONTENT_OUTPUT_CONTRACT_EXAMPLE = {
  pages: [
    {
      pageSlug: "/",
      pageType: "home",
      messaging: {
        pageHeadline: "Outcome-oriented homepage headline",
        pageSubheadline: "A concise supporting line",
        valueProposition: "Single-sentence value proposition",
      },
      sections: {
        hero: {
          headline: "Hero headline",
          subheadline: "Hero subheadline",
          supportingCopy: "A concise supporting paragraph",
          primaryCta: "Book a call",
          secondaryCta: "Learn more",
        },
        about: {
          headline: "About",
          paragraphs: ["Short paragraph"],
          bullets: ["Proof point"],
        },
        services: {
          headline: "Services",
          items: [{ name: "Service", description: "Outcome-focused copy" }],
        },
        cta: {
          headline: "Ready to start?",
          supportingLine: "Clear conversion-focused supporting line",
          ctaText: "Get started",
        },
        contact: {
          headline: "Contact",
          channels: [{ label: "Email", value: "hello@example.com" }],
        },
        footer: {
          shortBlurb: "Short trust-building footer blurb",
          legalText: "© Brand Name",
        },
        microcopy: {
          primaryButtonLabel: "Get started",
          trustIndicator: "No obligation",
        },
      },
    },
  ],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePageContent(page: Partial<GeneratedPageContent>, index: number): string[] {
  const errors: string[] = [];
  const label = `pages[${index}]`;

  if (!isNonEmptyString(page.pageSlug)) {
    errors.push(`${label}.pageSlug is required`);
  }

  if (!isNonEmptyString(page.pageType)) {
    errors.push(`${label}.pageType is required`);
  }

  if (!isObject(page.messaging)) {
    errors.push(`${label}.messaging is required`);
  } else {
    if (!isNonEmptyString(page.messaging.pageHeadline)) {
      errors.push(`${label}.messaging.pageHeadline is required`);
    }
    if (!isNonEmptyString(page.messaging.valueProposition)) {
      errors.push(`${label}.messaging.valueProposition is required`);
    }
  }

  if (!isObject(page.sections)) {
    errors.push(`${label}.sections is required`);
  }

  return errors;
}

export function validateWebsiteContentShape(
  content: Partial<WebsiteContentPackage>,
): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(content.id)) errors.push("id is required");
  if (!isNonEmptyString(content.structureId)) errors.push("structureId is required");
  if (!isNonEmptyString(content.userId)) errors.push("userId is required");
  if (!isNonEmptyString(content.websiteType)) errors.push("websiteType is required");

  if (!Array.isArray(content.pages) || content.pages.length === 0) {
    errors.push("pages must include at least one page");
  } else {
    content.pages.forEach((page, index) => {
      errors.push(...validatePageContent(page, index));
    });
  }

  if (!isNonEmptyString(content.generatedAt)) errors.push("generatedAt is required");
  if (!isNonEmptyString(content.updatedAt)) errors.push("updatedAt is required");
  if (typeof content.version !== "number" || content.version < 1) {
    errors.push("version must be a positive integer");
  }

  return errors;
}

export function isValidWebsiteContentShape(
  content: Partial<WebsiteContentPackage>,
): content is WebsiteContentPackage {
  return validateWebsiteContentShape(content).length === 0;
}

export function contentOutputContractJson(): string {
  return JSON.stringify(CONTENT_OUTPUT_CONTRACT_EXAMPLE, null, 2);
}

export function normalizePageContext(context: PageGenerationContext): PageGenerationContext {
  return {
    ...context,
    pageSlug: context.pageSlug.trim() || "/",
    sections: context.sections,
  };
}
