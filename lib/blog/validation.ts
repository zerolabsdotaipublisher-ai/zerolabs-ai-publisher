import { resolveSectionCount, slugify, targetWordCount } from "./seo";
import type { BlogGenerationInput, BlogPostSection, GeneratedBlogPost } from "./types";

const BANNED_PHRASES = [
  "as an ai",
  "language model",
  "game-changing",
  "revolutionary",
  "unlock",
];

const MIN_SECTION_PARAGRAPHS = 2;

function trimOrUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeIsoTimestamp(value?: string): string | undefined {
  const trimmed = trimOrUndefined(value);
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function sanitizeParagraphs(paragraphs: string[] | undefined): string[] {
  return (paragraphs ?? [])
    .map((paragraph) => paragraph.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function sanitizeSection(section: BlogPostSection, index: number): BlogPostSection {
  return {
    id: section.id?.trim() || `section_${index + 1}`,
    heading: section.heading?.trim() || `Section ${index + 1}`,
    summary: section.summary?.trim() || "",
    paragraphs: sanitizeParagraphs(section.paragraphs),
    h3Headings: (section.h3Headings ?? []).map((heading) => heading.trim()).filter(Boolean),
    focusKeyword: trimOrUndefined(section.focusKeyword),
  };
}

export function sanitizeBlogGenerationInput(input: BlogGenerationInput): BlogGenerationInput {
  return {
    ...input,
    siteTitle: input.siteTitle.trim(),
    topic: input.topic.trim(),
    keywords: input.keywords.map((keyword) => keyword.trim()).filter(Boolean),
    targetAudience: input.targetAudience.trim(),
    authorName: trimOrUndefined(input.authorName),
    brandName: trimOrUndefined(input.brandName),
    summary: trimOrUndefined(input.summary),
    callToAction: trimOrUndefined(input.callToAction),
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
    sectionCount: resolveSectionCount(input.length, input.sectionCount),
    style: input.style ?? "editorial",
    publishAt: normalizeIsoTimestamp(input.publishAt),
  };
}

export function validateBlogGenerationInput(input: BlogGenerationInput): string[] {
  const errors: string[] = [];

  if (!input.siteTitle.trim()) errors.push("siteTitle is required");
  if (!input.topic.trim()) errors.push("topic is required");
  if (!input.targetAudience.trim()) errors.push("targetAudience is required");
  if (!input.keywords.length) errors.push("keywords must include at least one entry");
  if (input.sectionCount !== undefined && (input.sectionCount < 2 || input.sectionCount > 8)) {
    errors.push("sectionCount must be between 2 and 8");
  }
  if (input.publishAt && Number.isNaN(new Date(input.publishAt).getTime())) {
    errors.push("publishAt must be a valid ISO timestamp");
  }

  return errors;
}

function containsBannedPhrase(value: string): boolean {
  const lowered = value.toLowerCase();
  return BANNED_PHRASES.some((phrase) => lowered.includes(phrase));
}

export function collectBlogQualityNotes(blog: GeneratedBlogPost): string[] {
  const notes: string[] = [];

  if (!blog.seo.metaTitle) notes.push("Meta title missing");
  if (!blog.seo.metaDescription) notes.push("Meta description missing");
  if (blog.sections.some((section) => section.paragraphs.length < MIN_SECTION_PARAGRAPHS)) {
    notes.push("One or more sections are too thin");
  }

  const textBlocks = [
    blog.title,
    blog.excerpt,
    blog.introduction,
    blog.conclusion,
    blog.callToAction,
    ...blog.sections.flatMap((section) => [section.heading, section.summary, ...section.paragraphs]),
  ];

  if (textBlocks.some(containsBannedPhrase)) {
    notes.push("Contains blocked filler or AI disclosure phrases");
  }

  return notes;
}

export function normalizeBlogPost(blog: GeneratedBlogPost): GeneratedBlogPost {
  const sections = blog.sections.map(sanitizeSection);
  const slug = slugify(blog.slug || blog.title || blog.sourceInput.topic);
  const normalized: GeneratedBlogPost = {
    ...blog,
    siteTitle: blog.siteTitle.trim(),
    title: blog.title.trim(),
    slug,
    excerpt: blog.excerpt.trim(),
    introduction: blog.introduction.trim(),
    sections,
    conclusion: blog.conclusion.trim(),
    callToAction: blog.callToAction.trim(),
    seo: {
      ...blog.seo,
      metaTitle: blog.seo.metaTitle.trim(),
      metaDescription: blog.seo.metaDescription.trim(),
      canonicalPath: `/${slug}`,
      focusKeyword: blog.seo.focusKeyword.trim(),
      secondaryKeywords: blog.seo.secondaryKeywords.map((keyword) => keyword.trim()).filter(Boolean),
      tags: blog.seo.tags.map((tag) => tag.trim()).filter(Boolean),
      headingOutline: {
        h1: blog.title.trim(),
        h2: sections.map((section) => section.heading),
        h3: sections.flatMap((section) => section.h3Headings ?? []),
      },
    },
    requirements: {
      ...blog.requirements,
      targetWordCount: targetWordCount(blog.requirements.length),
      sectionCount: resolveSectionCount(blog.requirements.length, blog.requirements.sectionCount),
    },
    scheduledPublishAt: normalizeIsoTimestamp(blog.scheduledPublishAt),
    publishedAt: normalizeIsoTimestamp(blog.publishedAt),
  };

  const qualityNotes = collectBlogQualityNotes(normalized);
  normalized.metadata = {
    ...normalized.metadata,
    qualityStatus: qualityNotes.length > 0 ? "needs_review" : "ready",
    qualityNotes,
  };

  return normalized;
}

export function validateGeneratedBlogPost(blog: GeneratedBlogPost): string[] {
  const errors: string[] = [];

  if (!blog.title.trim()) errors.push("title is required");
  if (!blog.slug.trim()) errors.push("slug is required");
  if (!blog.introduction.trim()) errors.push("introduction is required");
  if (!blog.conclusion.trim()) errors.push("conclusion is required");
  if (!blog.sections.length) errors.push("sections must not be empty");

  blog.sections.forEach((section, index) => {
    if (!section.heading.trim()) {
      errors.push(`sections[${index}].heading is required`);
    }
    if (section.paragraphs.length < MIN_SECTION_PARAGRAPHS) {
      errors.push(`sections[${index}] must include at least ${MIN_SECTION_PARAGRAPHS} paragraphs`);
    }
  });

  if (!blog.seo.metaTitle.trim()) errors.push("seo.metaTitle is required");
  if (!blog.seo.metaDescription.trim()) errors.push("seo.metaDescription is required");
  if (!blog.seo.focusKeyword.trim()) errors.push("seo.focusKeyword is required");
  if (blog.metadata.wordCount <= 0) errors.push("metadata.wordCount must be positive");

  return errors;
}
