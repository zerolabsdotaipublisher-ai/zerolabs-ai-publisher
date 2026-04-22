import type { SeoContentMetadata } from "./types";

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

function countOccurrences(text: string, phrase: string): number {
  if (!text || !phrase) return 0;
  const matches = text.toLowerCase().match(new RegExp(phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
  return matches?.length ?? 0;
}

export function validateSeoContent(metadata: Pick<SeoContentMetadata, "titleTag" | "metaDescription" | "headingStructure" | "keywordStrategy" | "internalLinks" | "readability" | "length"> & { fullText?: string }): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!metadata.titleTag.trim()) issues.push("Title tag is required");
  if (!metadata.metaDescription.trim()) issues.push("Meta description is required");
  if (!metadata.headingStructure.h1.trim()) issues.push("H1 is required");
  if (metadata.headingStructure.h2.length === 0) warnings.push("At least one H2 is recommended");
  if (metadata.titleTag.length > MAX_TITLE_LENGTH) warnings.push("Title tag exceeds ideal SEO length");
  if (metadata.metaDescription.length > MAX_DESCRIPTION_LENGTH) warnings.push("Meta description exceeds ideal SEO length");
  if (metadata.internalLinks.length === 0) warnings.push("No internal links were suggested");
  if (!metadata.length.withinRange) warnings.push("Content length is outside the recommended range");
  if (!metadata.readability.scannable) warnings.push("Paragraph structure may be hard to scan");

  const duplicateH2 = new Set<string>();
  metadata.headingStructure.h2.forEach((heading) => {
    const normalized = heading.trim().toLowerCase();
    if (!normalized) {
      issues.push("Empty H2 heading detected");
      return;
    }
    if (duplicateH2.has(normalized)) {
      warnings.push("Duplicate H2 headings detected");
      return;
    }
    duplicateH2.add(normalized);
  });

  const fullText = metadata.fullText ?? "";
  const keywordMentions = countOccurrences(fullText, metadata.keywordStrategy.primaryKeyword);
  if (keywordMentions > Math.max(8, Math.ceil(metadata.readability.estimatedWordCount / 120))) {
    warnings.push("Primary keyword may be overused");
  }

  return { issues, warnings };
}
