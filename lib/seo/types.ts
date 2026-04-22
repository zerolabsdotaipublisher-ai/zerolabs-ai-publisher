export type SeoContentType = "website-page" | "blog" | "article";

export type SeoSearchIntent =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational"
  | "local";

export interface SeoKeywordInput {
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  targetAudience?: string;
  searchIntent?: SeoSearchIntent;
}

export interface SeoKeywordStrategy {
  primaryKeyword: string;
  secondaryKeywords: string[];
  targetAudience: string;
  searchIntent: SeoSearchIntent;
  keywordCluster: string[];
}

export interface SeoHeadingStructure {
  h1: string;
  h2: string[];
  h3: string[];
}

export interface SeoInternalLink {
  href: string;
  anchorText: string;
  reason: string;
}

export interface SeoExternalReferenceSuggestion {
  label: string;
  url?: string;
  reason: string;
}

export interface SeoReadabilityMetadata {
  estimatedWordCount: number;
  readingTimeMinutes: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordsPerSentence: number;
  averageWordsPerParagraph: number;
  scannable: boolean;
}

export interface SeoLengthMetadata {
  targetWordCount: number;
  minimumWordCount: number;
  maximumWordCount: number;
  withinRange: boolean;
}

export interface SeoGuardrailResult {
  keywordStuffingRisk: boolean;
  duplicateHeadingRisk: boolean;
  malformedMetadataRisk: boolean;
  genericContentRisk: boolean;
  issues: string[];
}

export interface SeoValidationSummary {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

export interface SeoScoreBreakdown {
  metadata: number;
  headings: number;
  links: number;
  readability: number;
  guardrails: number;
}

export interface SeoScoreSummary {
  total: number;
  breakdown: SeoScoreBreakdown;
  label: "strong" | "good" | "needs-work";
}

export interface SeoPerformanceMetadata {
  evaluationVersion: number;
  lastEvaluatedAt: string;
  monitorFields: string[];
  analyticsReady: boolean;
}

export interface SeoContentMetadata {
  contentType: SeoContentType;
  slug: string;
  titleTag: string;
  metaDescription: string;
  keywordStrategy: SeoKeywordStrategy;
  headingStructure: SeoHeadingStructure;
  internalLinks: SeoInternalLink[];
  externalReferences?: SeoExternalReferenceSuggestion[];
  readability: SeoReadabilityMetadata;
  length: SeoLengthMetadata;
  guardrails: SeoGuardrailResult;
  validation: SeoValidationSummary;
  score: SeoScoreSummary;
  performance: SeoPerformanceMetadata;
}

export interface SeoGenerationInput {
  contentType: SeoContentType;
  title: string;
  slug: string;
  summary: string;
  keywords?: string[];
  keywordInput?: SeoKeywordInput;
  targetAudience?: string;
  searchIntent?: SeoSearchIntent;
  headings?: SeoHeadingStructure;
  bodyText: string[];
  targetWordCount: number;
  internalLinkCandidates?: Array<{ href: string; title: string; type?: string }>;
  externalReferenceCandidates?: SeoExternalReferenceSuggestion[];
}

export interface SeoPreviewPayload {
  structureId: string;
  contentType: "website" | "blog" | "article";
  site?: SeoContentMetadata | null;
  pages: SeoContentMetadata[];
}
