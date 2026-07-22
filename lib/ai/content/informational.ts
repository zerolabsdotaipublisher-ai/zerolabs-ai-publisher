import type { WebsiteGenerationInput } from "../prompts/types";
import { resolveWebsiteGenerationInput } from "../default-inputs";
import type {
  InformationalSectionContent,
  ServicesSectionContent,
} from "./types";

function defaultParagraphs(input: WebsiteGenerationInput): string[] {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return [
    `${resolvedInput.brandName} helps ${resolvedInput.targetAudience} with focused delivery and measurable outcomes.`,
    "Each engagement is shaped around clear scope, practical communication, and work that is easy to act on.",
  ];
}

export function createAboutFallback(
  input: WebsiteGenerationInput,
): InformationalSectionContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    variant: "stacked",
    headline: `Why ${resolvedInput.brandName}`,
    subheadline: "Clear thinking. Reliable execution.",
    description: resolvedInput.description,
    paragraphs: defaultParagraphs(resolvedInput),
    bullets: ["Clear scope", "Transparent communication", "Outcome-focused work"],
    items: [
      {
        title: "Audience fit",
        description: `Designed for ${resolvedInput.targetAudience} with practical, conversion-aware positioning.`,
      },
      {
        title: "Working style",
        description: "Strategic thinking, steady delivery, and clear next steps from the first review onward.",
      },
      {
        title: "What clients get",
        description: "A sharper message, a cleaner structure, and momentum that keeps the next decision easy.",
      },
    ],
    audience: resolvedInput.targetAudience,
    tone: resolvedInput.tone,
    density: "medium",
    goal: resolvedInput.primaryCta,
  };
}

export function createServicesFallback(
  input: WebsiteGenerationInput,
): ServicesSectionContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    variant: "grid",
    headline: "Services",
    subheadline: "Built around your priorities",
    description: `Offerings tailored to ${resolvedInput.targetAudience}.`,
    paragraphs: [
      `${resolvedInput.brandName} keeps each offer focused on clear outcomes, efficient delivery, and steady communication.`,
    ],
    bullets: resolvedInput.services.slice(0, 6),
    items: resolvedInput.services.slice(0, 6).map((service) => ({
      name: service,
      description: `Delivered with clear milestones, practical implementation support, and a scope that stays easy to understand.`,
      descriptor: "Outcome-driven",
    })),
    audience: resolvedInput.targetAudience,
    tone: resolvedInput.tone,
    density: "medium",
    goal: resolvedInput.primaryCta,
  };
}

export function createInformationalFallback(
  label: string,
  input: WebsiteGenerationInput,
): InformationalSectionContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    variant: label === "How it works" ? "stacked" : "grid",
    headline: label,
    subheadline: `Built for ${resolvedInput.targetAudience}`,
    description: resolvedInput.description,
    paragraphs: defaultParagraphs(resolvedInput),
    bullets: [
      "Clear positioning",
      "Practical execution",
      "Sustained momentum",
    ],
    items: [
      {
        title: `${label} that stay practical`,
        description: `${resolvedInput.brandName} keeps the message clear for ${resolvedInput.targetAudience}.`,
      },
      {
        title: "Designed for conversion",
        description: "Every section should make the next action easier to take without overexplaining the offer.",
      },
      {
        title: "Ready for real use",
        description: "The default copy is structured to feel publishable, not like a temporary placeholder block.",
      },
    ],
    audience: resolvedInput.targetAudience,
    tone: resolvedInput.tone,
    density: "medium",
    goal: resolvedInput.primaryCta,
  };
}

export function normalizeInformationalSection(
  content: Partial<InformationalSectionContent> | undefined,
  fallback: InformationalSectionContent,
): InformationalSectionContent {
  return {
    variant: content?.variant || fallback.variant,
    headline: content?.headline?.trim() || fallback.headline,
    subheadline: content?.subheadline?.trim() || fallback.subheadline,
    description: content?.description?.trim() || fallback.description,
    paragraphs:
      content?.paragraphs?.map((p) => p.trim()).filter(Boolean) ||
      fallback.paragraphs,
    bullets: content?.bullets?.map((b) => b.trim()).filter(Boolean) || fallback.bullets,
    items:
      content?.items
        ?.map((item) => ({
          title: item.title?.trim() || item.name?.trim(),
          description: item.description?.trim(),
          eyebrow: item.eyebrow?.trim(),
          descriptor: item.descriptor?.trim(),
          bullets: item.bullets?.map((bullet) => bullet.trim()).filter(Boolean),
        }))
        .filter((item) => item.title && item.description)
        .slice(0, 8) || fallback.items,
    audience: content?.audience?.trim() || fallback.audience,
    tone: content?.tone || fallback.tone,
    density: content?.density || fallback.density,
    goal: content?.goal?.trim() || fallback.goal,
  };
}

export function normalizeServicesSection(
  content: Partial<ServicesSectionContent> | undefined,
  input: WebsiteGenerationInput,
): ServicesSectionContent {
  const fallback = createServicesFallback(input);
  const normalizedInfo = normalizeInformationalSection(
    content
      ? {
          ...content,
          items: undefined,
        }
      : undefined,
    {
      ...fallback,
      items: undefined,
    },
  );

  return {
    ...normalizedInfo,
    variant: content?.variant || fallback.variant,
    items:
      content?.items
        ?.map((item) => ({
          name: item.name?.trim(),
          description: item.description?.trim(),
          descriptor: item.descriptor?.trim(),
        }))
        .filter((item) => item.name && item.description)
        .slice(0, 8) || fallback.items,
  };
}
