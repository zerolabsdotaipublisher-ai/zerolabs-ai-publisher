import type { WebsiteGenerationInput } from "../types";

export function createContactSectionTemplate(
  input: WebsiteGenerationInput,
): string {
  return [
    "Generate only the contact section JSON.",
    `Contact data: ${JSON.stringify(input.contactInfo ?? {})}`,
    "Required fields when present: headline, channels[].label, channels[].value.",
    "Use only provided contact channels.",
  ].join("\n");
}
