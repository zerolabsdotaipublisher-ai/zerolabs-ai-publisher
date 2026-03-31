import type { WebsiteGenerationInput } from "../types";

export function createAboutSectionTemplate(input: WebsiteGenerationInput): string {
  return [
    "Generate only the about section JSON.",
    `Brand description: ${input.description}`,
    input.founderProfile?.bio
      ? `Founder context: ${input.founderProfile.bio}`
      : "Founder context: not provided",
    "Required fields: headline, body.",
    "Body should be 2-4 short sentences with concrete value framing.",
  ].join("\n");
}
