import type { SeoContentMetadata, SeoGenerationInput, SeoKeywordInput } from "./types";

export const SEO_KEYWORD_INPUT_SCHEMA: SeoKeywordInput = {
  primaryKeyword: "primary keyword",
  secondaryKeywords: ["secondary keyword"],
  targetAudience: "target audience",
  searchIntent: "informational",
};

export const SEO_GENERATION_INPUT_SCHEMA: SeoGenerationInput = {
  contentType: "blog",
  title: "Content title",
  slug: "/content-slug",
  summary: "Short summary",
  keywords: ["content keyword"],
  keywordInput: SEO_KEYWORD_INPUT_SCHEMA,
  targetAudience: "Marketing teams",
  searchIntent: "informational",
  headings: {
    h1: "Content title",
    h2: ["Section heading"],
    h3: ["Supporting heading"],
  },
  bodyText: ["Paragraph text"],
  targetWordCount: 1200,
  internalLinkCandidates: [{ href: "/", title: "Home", type: "home" }],
  externalReferenceCandidates: [{ label: "Supporting reference", reason: "Add credibility" }],
};

export const SEO_CONTENT_SCHEMA_EXAMPLE: SeoContentMetadata = {
  contentType: "blog",
  slug: "/content-slug",
  titleTag: "Primary keyword | Content title",
  metaDescription: "Concise summary that uses the primary keyword naturally.",
  keywordStrategy: {
    primaryKeyword: "primary keyword",
    secondaryKeywords: ["secondary keyword"],
    targetAudience: "Marketing teams",
    searchIntent: "informational",
    keywordCluster: ["primary keyword", "secondary keyword"],
  },
  headingStructure: {
    h1: "Content title",
    h2: ["Section heading"],
    h3: ["Supporting heading"],
  },
  internalLinks: [{ href: "/", anchorText: "Home", reason: "Route discovery" }],
  externalReferences: [{ label: "Supporting reference", reason: "Add credibility" }],
  readability: {
    estimatedWordCount: 1200,
    readingTimeMinutes: 6,
    sentenceCount: 60,
    paragraphCount: 16,
    averageWordsPerSentence: 20,
    averageWordsPerParagraph: 75,
    scannable: true,
  },
  length: {
    targetWordCount: 1200,
    minimumWordCount: 840,
    maximumWordCount: 1560,
    withinRange: true,
  },
  guardrails: {
    keywordStuffingRisk: false,
    duplicateHeadingRisk: false,
    malformedMetadataRisk: false,
    genericContentRisk: false,
    issues: [],
  },
  validation: {
    passed: true,
    issues: [],
    warnings: [],
  },
  score: {
    total: 92,
    breakdown: {
      metadata: 95,
      headings: 90,
      links: 88,
      readability: 93,
      guardrails: 94,
    },
    label: "strong",
  },
  performance: {
    evaluationVersion: 1,
    lastEvaluatedAt: "2026-04-22T00:00:00.000Z",
    monitorFields: ["titleTag", "metaDescription", "internalLinks", "score.total"],
    analyticsReady: true,
  },
};
