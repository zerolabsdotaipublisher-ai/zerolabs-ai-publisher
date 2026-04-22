import type { SeoContentMetadata } from "./types";

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;
const MIN_KEYWORD_STUFFING_THRESHOLD = 8;
const KEYWORD_DENSITY_WORD_RATIO = 120;

export const SEO_VALIDATION_WARNINGS = {
  missingH2: "At least one H2 is recommended",
  titleTooLong: "Title tag exceeds ideal SEO length",
  descriptionTooLong: "Meta description exceeds ideal SEO length",
  noInternalLinks: "No internal links were suggested",
  lengthOutOfRange: "Content length is outside the recommended range",
  hardToScan: "Paragraph structure may be hard to scan",
  duplicateH2: "Duplicate H2 headings detected",
  keywordOveruse: "Primary keyword may be overused",
} as const;

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
  if (metadata.headingStructure.h2.length === 0) warnings.push(SEO_VALIDATION_WARNINGS.missingH2);
  if (metadata.titleTag.length > MAX_TITLE_LENGTH) warnings.push(SEO_VALIDATION_WARNINGS.titleTooLong);
  if (metadata.metaDescription.length > MAX_DESCRIPTION_LENGTH) warnings.push(SEO_VALIDATION_WARNINGS.descriptionTooLong);
  if (metadata.internalLinks.length === 0) warnings.push(SEO_VALIDATION_WARNINGS.noInternalLinks);
  if (!metadata.length.withinRange) warnings.push(SEO_VALIDATION_WARNINGS.lengthOutOfRange);
  if (!metadata.readability.scannable) warnings.push(SEO_VALIDATION_WARNINGS.hardToScan);

  const duplicateH2 = new Set<string>();
  metadata.headingStructure.h2.forEach((heading) => {
    const normalized = heading.trim().toLowerCase();
    if (!normalized) {
      issues.push("Empty H2 heading detected");
      return;
    }
    if (duplicateH2.has(normalized)) {
      warnings.push(SEO_VALIDATION_WARNINGS.duplicateH2);
      return;
    }
    duplicateH2.add(normalized);
  });

  const fullText = metadata.fullText ?? "";
  const keywordMentions = countOccurrences(fullText, metadata.keywordStrategy.primaryKeyword);
  if (
    keywordMentions >
    Math.max(
      MIN_KEYWORD_STUFFING_THRESHOLD,
      Math.ceil(metadata.readability.estimatedWordCount / KEYWORD_DENSITY_WORD_RATIO),
    )
  ) {
    warnings.push(SEO_VALIDATION_WARNINGS.keywordOveruse);
  }

  return { issues, warnings };
}
