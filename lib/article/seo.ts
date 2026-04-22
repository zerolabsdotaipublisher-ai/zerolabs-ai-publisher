import { generateSeoContentMetadata } from "@/lib/seo";
import type {
  ArticleGenerationInput,
  ArticleLengthPreset,
  ArticleMetadata,
  ArticleReference,
  ArticleSection,
  ArticleSeoMetadata,
} from "./types";

const DEFAULT_AUTHOR = "Zero Labs Editorial";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function trimToSentence(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function targetWordCount(length: ArticleLengthPreset): number {
  switch (length) {
    case "short":
      return 900;
    case "long":
      return 2200;
    case "extended":
      return 3200;
    default:
      return 1400;
  }
}

export function resolveSectionCount(length: ArticleLengthPreset, requested?: number): number {
  if (typeof requested === "number" && requested >= 2 && requested <= 10) {
    return requested;
  }

  switch (length) {
    case "short":
      return 3;
    case "long":
      return 6;
    case "extended":
      return 8;
    default:
      return 5;
  }
}

export function estimateWordCount(
  title: string,
  subtitle: string,
  introduction: string,
  sections: ArticleSection[],
  conclusion: string,
  callToAction: string,
  references?: ArticleReference[],
): number {
  const parts = [
    title,
    subtitle,
    introduction,
    conclusion,
    callToAction,
    ...sections.flatMap((section) => [
      section.heading,
      section.summary,
      ...(section.h3Headings ?? []),
      ...(section.takeaways ?? []),
      ...section.paragraphs,
    ]),
    ...(references ?? []).flatMap((reference) => [reference.title, reference.source, reference.note]),
  ];

  return parts
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function normalizeTags(keywords: string[], tags?: string[]): string[] {
  return Array.from(
    new Set(
      [...(tags ?? []), ...keywords]
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => trimToSentence(entry, 32)),
    ),
  ).slice(0, 10);
}

export function createArticleSeoMetadata(args: {
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  keywords: string[];
  sections: ArticleSection[];
  tags?: string[];
  targetAudience?: string;
  searchIntent?: ArticleGenerationInput["seo"]["searchIntent"];
  keywordInput?: ArticleGenerationInput["seo"];
  internalLinkCandidates?: Array<{ href: string; title: string; type?: string }>;
  externalReferenceCandidates?: Array<{ label: string; url?: string; reason: string }>;
  targetWordCount?: number;
}): ArticleSeoMetadata {
  const h3 = args.sections.flatMap((section) => section.h3Headings ?? []);
  const optimization = generateSeoContentMetadata({
    contentType: "article",
    title: args.title,
    slug: args.slug,
    summary: args.excerpt || args.subtitle,
    keywords: args.keywords,
    keywordInput: args.keywordInput,
    targetAudience: args.targetAudience,
    searchIntent: args.searchIntent,
    headings: {
      h1: args.title,
      h2: args.sections.map((section) => section.heading),
      h3,
    },
    bodyText: [
      args.subtitle,
      args.excerpt,
      ...args.sections.flatMap((section) => [
        section.summary,
        ...(section.takeaways ?? []),
        ...section.paragraphs,
      ]),
    ],
    targetWordCount: args.targetWordCount ?? 1400,
    internalLinkCandidates: args.internalLinkCandidates,
    externalReferenceCandidates: args.externalReferenceCandidates,
  });

  return {
    metaTitle: trimToSentence(optimization.titleTag, 60),
    metaDescription: trimToSentence(optimization.metaDescription, 160),
    canonicalPath: `/${args.slug}`,
    focusKeyword: optimization.keywordStrategy.primaryKeyword,
    secondaryKeywords: optimization.keywordStrategy.secondaryKeywords,
    tags: normalizeTags(args.keywords, args.tags),
    headingOutline: {
      h1: args.title,
      h2: args.sections.map((section) => section.heading),
      h3,
    },
    suggestedInternalLinks: optimization.internalLinks.map((link) => link.href),
    optimization,
  };
}

export function createArticleMetadata(args: {
  input: ArticleGenerationInput;
  generatedAt: string;
  updatedAt: string;
  title: string;
  subtitle: string;
  sections: ArticleSection[];
  introduction: string;
  conclusion: string;
  callToAction: string;
  references?: ArticleReference[];
  qualityNotes: string[];
  versionId?: string;
}): ArticleMetadata {
  const wordCount = estimateWordCount(
    args.title,
    args.subtitle,
    args.introduction,
    args.sections,
    args.conclusion,
    args.callToAction,
    args.references,
  );

  return {
    authorName: args.input.authorName?.trim() || DEFAULT_AUTHOR,
    createdAt: args.generatedAt,
    updatedAt: args.updatedAt,
    versionId: args.versionId,
    readingTimeMinutes: estimateReadingTime(wordCount),
    wordCount,
    tags: normalizeTags(args.input.keywords, args.input.tags),
    qualityStatus: args.qualityNotes.length > 0 ? "needs_review" : "ready",
    qualityNotes: args.qualityNotes,
    targetAudience: args.input.targetAudience,
    articleType: args.input.articleType,
    usedOutline: Boolean(args.input.outline?.length),
    referenceCount: args.references?.length ?? 0,
  };
}
