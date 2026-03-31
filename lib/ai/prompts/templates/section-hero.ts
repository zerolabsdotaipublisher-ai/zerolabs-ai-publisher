import type { WebsiteGenerationInput } from "../types";

export function createHeroSectionTemplate(input: WebsiteGenerationInput): string {
  return [
    "Generate only the hero section JSON.",
    `Brand: ${input.brandName}`,
    `Audience: ${input.targetAudience}`,
    `Primary CTA: ${input.primaryCta}`,
    "Required fields: headline, subheadline, primaryCta, optional secondaryCta.",
    "Keep headline <= 10 words and subheadline <= 24 words.",
  ].join("\n");
}
