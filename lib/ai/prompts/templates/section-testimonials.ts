import type { WebsiteGenerationInput } from "../types";

export function createTestimonialsSectionTemplate(
  input: WebsiteGenerationInput,
): string {
  return [
    "Generate only the testimonials section JSON.",
    input.testimonials?.length
      ? `Allowed source testimonials: ${JSON.stringify(input.testimonials)}`
      : "No testimonials supplied: return section as omitted recommendation.",
    "Required fields when present: headline, items[].quote, items[].author, optional items[].role.",
    "Do not invent testimonials.",
  ].join("\n");
}
