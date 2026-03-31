import type { WebsiteGenerationInput } from "../types";

export function createServicesSectionTemplate(
  input: WebsiteGenerationInput,
): string {
  return [
    "Generate only the services section JSON.",
    `Services list: ${input.services.join(" | ")}`,
    "Required fields: headline, items[].name, items[].description.",
    "Keep each item description to one concise sentence with outcome focus.",
  ].join("\n");
}
