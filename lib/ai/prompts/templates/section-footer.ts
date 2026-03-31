import type { WebsiteGenerationInput } from "../types";

export function createFooterSectionTemplate(input: WebsiteGenerationInput): string {
  return [
    "Generate only the footer section JSON.",
    `Brand: ${input.brandName}`,
    "Required fields: shortBlurb, optional legalText.",
    "Blurb should be 8-16 words and aligned with brand positioning.",
  ].join("\n");
}
