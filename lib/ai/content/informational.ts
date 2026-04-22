import type { WebsiteGenerationInput } from "../prompts/types";
import type {
  InformationalSectionContent,
  ServicesSectionContent,
} from "./types";

function defaultParagraphs(input: WebsiteGenerationInput): string[] {
  return [
    `${input.brandName} helps ${input.targetAudience} with focused delivery and measurable outcomes.`,
    `We combine strategy and execution so each engagement maps directly to business goals.`,
  ];
}

export function createAboutFallback(
  input: WebsiteGenerationInput,
): InformationalSectionContent {
  return {
    variant: "stacked",
    headline: `Why ${input.brandName}`,
    subheadline: "A practical partner for growth",
    description: input.description,
    paragraphs: defaultParagraphs(input),
    bullets: ["Clear scope", "Transparent communication", "Outcome-focused work"],
    items: [
      {
        title: "Audience fit",
        description: `Designed for ${input.targetAudience} with practical, conversion-aware positioning.`,
      },
      {
        title: "Working style",
        description: "Strategic thinking, fast delivery, and clear next steps.",
      },
    ],
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
  };
}

export function createServicesFallback(
  input: WebsiteGenerationInput,
): ServicesSectionContent {
  return {
    variant: "grid",
    headline: "Services",
    subheadline: "Built around your priorities",
    description: `Offerings tailored to ${input.targetAudience}.`,
    paragraphs: [
      `Our services are designed to help ${input.targetAudience} move faster with confidence.`,
    ],
    bullets: input.services.slice(0, 6),
    items: input.services.slice(0, 6).map((service) => ({
      name: service,
        description: `Delivered with clear milestones and practical implementation support.`,
        descriptor: "Outcome-driven",
      })),
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
  };
}

export function createInformationalFallback(
  label: string,
  input: WebsiteGenerationInput,
): InformationalSectionContent {
  return {
    variant: label === "How it works" ? "stacked" : "grid",
    headline: label,
    subheadline: `Built for ${input.targetAudience}`,
    description: input.description,
    paragraphs: defaultParagraphs(input),
    bullets: [
      "Clear positioning",
      "Practical execution",
      "Sustained momentum",
    ],
    items: [
      {
        title: `${label} that stay practical`,
        description: `${input.brandName} keeps the message clear for ${input.targetAudience}.`,
      },
      {
        title: "Designed for conversion",
        description: "Every section should make the next action easier to take.",
      },
    ],
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
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
