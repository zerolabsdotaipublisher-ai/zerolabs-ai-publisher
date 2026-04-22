import type { SeoKeywordStrategy } from "./types";

export function buildSeoPromptGuidance(strategy: SeoKeywordStrategy): string[] {
  return [
    `Use the primary keyword \"${strategy.primaryKeyword}\" naturally in the title, intro, and metadata.`,
    strategy.secondaryKeywords.length > 0
      ? `Blend these secondary keywords naturally where relevant: ${strategy.secondaryKeywords.join(", ")}.`
      : "Avoid adding unrelated secondary keywords.",
    `Write for ${strategy.targetAudience}.`,
    `Match ${strategy.searchIntent} search intent without keyword stuffing.`,
    "Prefer scannable paragraphs and clear H2/H3 hierarchy.",
    "Suggest only relevant internal links that match real routes or published content.",
  ];
}
