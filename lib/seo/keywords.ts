import type { SeoKeywordInput, SeoKeywordStrategy, SeoSearchIntent } from "./types";

const DEFAULT_SEARCH_INTENT: SeoSearchIntent = "informational";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function resolveSeoKeywordStrategy(args: {
  title: string;
  keywords?: string[];
  keywordInput?: SeoKeywordInput;
  targetAudience?: string;
  searchIntent?: SeoSearchIntent;
}): SeoKeywordStrategy {
  const keywordInput = args.keywordInput;
  const primaryKeyword =
    keywordInput?.primaryKeyword?.trim() || args.keywords?.[0]?.trim() || args.title.trim();
  const secondaryKeywords = unique([
    ...(keywordInput?.secondaryKeywords ?? []),
    ...(args.keywords ?? []).slice(args.keywords?.[0] ? 1 : 0),
  ]).filter((keyword) => keyword !== primaryKeyword).slice(0, 5);

  return {
    primaryKeyword,
    secondaryKeywords,
    targetAudience:
      keywordInput?.targetAudience?.trim() || args.targetAudience?.trim() || "general readers",
    searchIntent: keywordInput?.searchIntent || args.searchIntent || DEFAULT_SEARCH_INTENT,
    keywordCluster: unique([primaryKeyword, ...secondaryKeywords]),
  };
}
