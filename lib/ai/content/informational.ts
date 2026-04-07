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
    headline: `Why ${input.brandName}`,
    subheadline: "A practical partner for growth",
    paragraphs: defaultParagraphs(input),
    bullets: ["Clear scope", "Transparent communication", "Outcome-focused work"],
  };
}

export function createServicesFallback(
  input: WebsiteGenerationInput,
): ServicesSectionContent {
  return {
    headline: "Services",
    subheadline: "Built around your priorities",
    paragraphs: [
      `Our services are designed to help ${input.targetAudience} move faster with confidence.`,
    ],
    bullets: input.services.slice(0, 6),
    items: input.services.slice(0, 6).map((service) => ({
      name: service,
      description: `Delivered with clear milestones and practical implementation support.`,
      descriptor: "Outcome-driven",
    })),
  };
}

export function createInformationalFallback(
  label: string,
  input: WebsiteGenerationInput,
): InformationalSectionContent {
  return {
    headline: label,
    subheadline: `Built for ${input.targetAudience}`,
    paragraphs: defaultParagraphs(input),
    bullets: [
      "Clear positioning",
      "Practical execution",
      "Sustained momentum",
    ],
  };
}

export function normalizeInformationalSection(
  content: Partial<InformationalSectionContent> | undefined,
  fallback: InformationalSectionContent,
): InformationalSectionContent {
  return {
    headline: content?.headline?.trim() || fallback.headline,
    subheadline: content?.subheadline?.trim() || fallback.subheadline,
    paragraphs:
      content?.paragraphs?.map((p) => p.trim()).filter(Boolean) ||
      fallback.paragraphs,
    bullets: content?.bullets?.map((b) => b.trim()).filter(Boolean) || fallback.bullets,
  };
}

export function normalizeServicesSection(
  content: Partial<ServicesSectionContent> | undefined,
  input: WebsiteGenerationInput,
): ServicesSectionContent {
  const fallback = createServicesFallback(input);
  const normalizedInfo = normalizeInformationalSection(content, fallback);

  return {
    ...normalizedInfo,
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
