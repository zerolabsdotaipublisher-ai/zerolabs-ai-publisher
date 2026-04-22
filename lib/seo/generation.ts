import { buildInternalLinks } from "./links";
import { resolveSeoKeywordStrategy } from "./keywords";
import { buildReadabilityScore, scoreSeoContent } from "./scoring";
import type {
  SeoContentMetadata,
  SeoExternalReferenceSuggestion,
  SeoGenerationInput,
  SeoHeadingStructure,
} from "./types";
import { validateSeoContent } from "./validation";

function normalizeSentence(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

function normalizeSlug(slug: string): string {
  if (!slug) return "/";
  return slug.startsWith("/") ? slug : `/${slug}`;
}

function toHeadingStructure(title: string, headings?: SeoHeadingStructure): SeoHeadingStructure {
  return {
    h1: headings?.h1?.trim() || title.trim(),
    h2: (headings?.h2 ?? []).map((heading) => heading.trim()).filter(Boolean),
    h3: (headings?.h3 ?? []).map((heading) => heading.trim()).filter(Boolean),
  };
}

function buildTitleTag(title: string, primaryKeyword: string): string {
  const base = title.toLowerCase().includes(primaryKeyword.toLowerCase())
    ? title
    : `${title} | ${primaryKeyword}`;
  return normalizeSentence(base, 60);
}

function buildMetaDescription(summary: string, primaryKeyword: string, targetAudience: string): string {
  const base = summary.toLowerCase().includes(primaryKeyword.toLowerCase())
    ? summary
    : `${summary} Learn how ${primaryKeyword} helps ${targetAudience}.`;
  return normalizeSentence(base, 160);
}

function buildReadability(bodyText: string[], targetWordCount: number) {
  const text = bodyText.join(" ").trim();
  const wordCount = countWords(text);
  const sentences = text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
  const paragraphs = bodyText.map((paragraph) => paragraph.trim()).filter(Boolean);
  const averageWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const averageWordsPerParagraph = paragraphs.length > 0 ? wordCount / paragraphs.length : wordCount;

  return {
    readability: {
      estimatedWordCount: wordCount,
      readingTimeMinutes: estimateReadingTime(wordCount),
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: Number(averageWordsPerSentence.toFixed(1)),
      averageWordsPerParagraph: Number(averageWordsPerParagraph.toFixed(1)),
      scannable: averageWordsPerSentence <= 24 && averageWordsPerParagraph <= 90,
    },
    length: {
      targetWordCount,
      minimumWordCount: Math.floor(targetWordCount * 0.7),
      maximumWordCount: Math.ceil(targetWordCount * 1.3),
      withinRange:
        wordCount >= Math.floor(targetWordCount * 0.7) && wordCount <= Math.ceil(targetWordCount * 1.3),
    },
  };
}

function buildExternalReferences(
  candidates: SeoExternalReferenceSuggestion[] | undefined,
  primaryKeyword: string,
): SeoExternalReferenceSuggestion[] | undefined {
  if (candidates?.length) {
    return candidates.slice(0, 3);
  }

  return [
    {
      label: `${primaryKeyword} source guidance`,
      reason: "Optional future-ready external reference for editorial review",
    },
  ];
}

export function generateSeoContentMetadata(input: SeoGenerationInput): SeoContentMetadata {
  const slug = normalizeSlug(input.slug);
  const headingStructure = toHeadingStructure(input.title, input.headings);
  const keywordStrategy = resolveSeoKeywordStrategy({
    title: input.title,
    keywords: input.keywords,
    keywordInput: input.keywordInput,
    targetAudience: input.targetAudience,
    searchIntent: input.searchIntent,
  });
  const titleTag = buildTitleTag(input.title, keywordStrategy.primaryKeyword);
  const metaDescription = buildMetaDescription(
    input.summary,
    keywordStrategy.primaryKeyword,
    keywordStrategy.targetAudience,
  );
  const internalLinks = buildInternalLinks({
    slug,
    title: input.title,
    contentType: input.contentType,
    candidates: input.internalLinkCandidates,
  });
  const readabilitySummary = buildReadability(input.bodyText, input.targetWordCount);
  const validationSummary = validateSeoContent({
    titleTag,
    metaDescription,
    headingStructure,
    keywordStrategy,
    internalLinks,
    readability: readabilitySummary.readability,
    length: readabilitySummary.length,
    fullText: input.bodyText.join(" "),
  });
  const guardrailIssues = [...validationSummary.issues, ...validationSummary.warnings];
  const score = scoreSeoContent({
    titleTag,
    metaDescription,
    headingCount: headingStructure.h2.length + headingStructure.h3.length + 1,
    internalLinkCount: internalLinks.length,
    readabilityScore: buildReadabilityScore(readabilitySummary),
    guardrailIssueCount: guardrailIssues.length,
  });

  return {
    contentType: input.contentType,
    slug,
    titleTag,
    metaDescription,
    keywordStrategy,
    headingStructure,
    internalLinks,
    externalReferences: buildExternalReferences(
      input.externalReferenceCandidates,
      keywordStrategy.primaryKeyword,
    ),
    readability: readabilitySummary.readability,
    length: readabilitySummary.length,
    guardrails: {
      keywordStuffingRisk: validationSummary.warnings.includes("Primary keyword may be overused"),
      duplicateHeadingRisk: validationSummary.warnings.includes("Duplicate H2 headings detected"),
      malformedMetadataRisk:
        validationSummary.issues.includes("Title tag is required") ||
        validationSummary.issues.includes("Meta description is required"),
      genericContentRisk: score.total < 70,
      issues: guardrailIssues,
    },
    validation: {
      passed: validationSummary.issues.length === 0,
      issues: validationSummary.issues,
      warnings: validationSummary.warnings,
    },
    score,
    performance: {
      evaluationVersion: 1,
      lastEvaluatedAt: new Date().toISOString(),
      monitorFields: [
        "titleTag",
        "metaDescription",
        "keywordStrategy.primaryKeyword",
        "internalLinks",
        "score.total",
      ],
      analyticsReady: true,
    },
  };
}
