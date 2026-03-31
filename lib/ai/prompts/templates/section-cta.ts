import type { WebsiteGenerationInput } from "../types";

export function createCtaSectionTemplate(input: WebsiteGenerationInput): string {
  return [
    "Generate only the CTA section JSON.",
    `Primary CTA intent: ${input.primaryCta}`,
    "Required fields: headline, ctaText.",
    "Copy should create urgency without exaggeration.",
  ].join("\n");
}
