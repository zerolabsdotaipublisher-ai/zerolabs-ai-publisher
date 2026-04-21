import type { BlogGenerationInput, BlogLengthPreset, BlogPostMetadata, BlogPostSection, BlogSeoMetadata } from "./types";

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

export function targetWordCount(length: BlogLengthPreset): number {
  switch (length) {
    case "short":
      return 700;
    case "long":
      return 1600;
    default:
      return 1100;
  }
}

export function resolveSectionCount(length: BlogLengthPreset, requested?: number): number {
  if (typeof requested === "number" && requested >= 2 && requested <= 8) {
    return requested;
  }

  switch (length) {
    case "short":
      return 3;
    case "long":
      return 6;
    default:
      return 4;
  }
}

export function estimateWordCount(
  introduction: string,
  sections: BlogPostSection[],
  conclusion: string,
  callToAction: string,
): number {
  const parts = [
    introduction,
    conclusion,
    callToAction,
    ...sections.flatMap((section) => [section.heading, section.summary, ...section.paragraphs]),
  ];

  return parts
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function estimateReadingTime(wordCount: number): number {
  // 220 WPM is a common editorial benchmark for web reading-time estimates.
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function normalizeTags(keywords: string[], tags?: string[]): string[] {
  return Array.from(
    new Set(
      [...(tags ?? []), ...keywords]
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => trimToSentence(entry, 28)),
    ),
  ).slice(0, 8);
}

export function createBlogSeoMetadata(args: {
  title: string;
  slug: string;
  excerpt: string;
  keywords: string[];
  sections: BlogPostSection[];
  tags?: string[];
}): BlogSeoMetadata {
  const focusKeyword = args.keywords[0] ?? slugify(args.title).replace(/-/g, " ");
  const secondaryKeywords = args.keywords.slice(1, 6);
  const metaTitle = trimToSentence(`${args.title} | ${focusKeyword}`, 60);
  const metaDescription = trimToSentence(args.excerpt, 160);
  const h3 = args.sections.flatMap((section) => section.h3Headings ?? []);

  return {
    metaTitle,
    metaDescription,
    canonicalPath: `/${args.slug}`,
    focusKeyword,
    secondaryKeywords,
    tags: normalizeTags(args.keywords, args.tags),
    headingOutline: {
      h1: args.title,
      h2: args.sections.map((section) => section.heading),
      h3,
    },
  };
}

export function createBlogMetadata(args: {
  input: BlogGenerationInput;
  generatedAt: string;
  updatedAt: string;
  sections: BlogPostSection[];
  introduction: string;
  conclusion: string;
  callToAction: string;
  qualityNotes: string[];
}): BlogPostMetadata {
  const wordCount = estimateWordCount(
    args.introduction,
    args.sections,
    args.conclusion,
    args.callToAction,
  );

  return {
    authorName: args.input.authorName?.trim() || DEFAULT_AUTHOR,
    createdAt: args.generatedAt,
    updatedAt: args.updatedAt,
    readingTimeMinutes: estimateReadingTime(wordCount),
    wordCount,
    tags: normalizeTags(args.input.keywords, args.input.tags),
    qualityStatus: args.qualityNotes.length > 0 ? "needs_review" : "ready",
    qualityNotes: args.qualityNotes,
  };
}
