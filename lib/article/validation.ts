import { resolveSectionCount, slugify, targetWordCount } from "./seo";
import type {
  ArticleGenerationInput,
  ArticleReference,
  ArticleSection,
  GeneratedArticle,
} from "./types";

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

function sanitizeReference(reference: ArticleReference): ArticleReference {
  return {
    title: reference.title.trim(),
    source: trimOrUndefined(reference.source),
    url: trimOrUndefined(reference.url),
    note: trimOrUndefined(reference.note),
  };
}

function sanitizeSection(section: ArticleSection, index: number): ArticleSection {
  return {
    id: section.id?.trim() || `section_${index + 1}`,
    heading: section.heading?.trim() || `Section ${index + 1}`,
    summary: section.summary?.trim() || "",
    paragraphs: sanitizeParagraphs(section.paragraphs),
    h3Headings: (section.h3Headings ?? []).map((heading) => heading.trim()).filter(Boolean),
    takeaways: (section.takeaways ?? []).map((takeaway) => takeaway.trim()).filter(Boolean),
    focusKeyword: trimOrUndefined(section.focusKeyword),
  };
}

export function sanitizeArticleGenerationInput(input: ArticleGenerationInput): ArticleGenerationInput {
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
    outline: input.outline?.map((entry) => entry.trim()).filter(Boolean),
    userContext: trimOrUndefined(input.userContext),
    references: input.references?.map(sanitizeReference).filter((reference) => reference.title),
    includeReferences: input.includeReferences ?? false,
    sectionCount: resolveSectionCount(input.length, input.sectionCount),
    style: input.style ?? "editorial",
    publishAt: normalizeIsoTimestamp(input.publishAt),
  };
}

export function validateArticleGenerationInput(input: ArticleGenerationInput): string[] {
  const errors: string[] = [];

  if (!input.siteTitle.trim()) errors.push("siteTitle is required");
  if (!input.topic.trim()) errors.push("topic is required");
  if (!input.targetAudience.trim()) errors.push("targetAudience is required");
  if (!input.keywords.length) errors.push("keywords must include at least one entry");
  if (input.sectionCount !== undefined && (input.sectionCount < 2 || input.sectionCount > 10)) {
    errors.push("sectionCount must be between 2 and 10");
  }
  if ((input.outline?.length ?? 0) > 10) {
    errors.push("outline cannot include more than 10 items");
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

export function collectArticleQualityNotes(article: GeneratedArticle): string[] {
  const notes: string[] = [];

  if (!article.seo.metaTitle) notes.push("Meta title missing");
  if (!article.seo.metaDescription) notes.push("Meta description missing");
  if (article.sections.some((section) => section.paragraphs.length < MIN_SECTION_PARAGRAPHS)) {
    notes.push("One or more sections are too thin");
  }
  if (article.metadata.wordCount < Math.floor(article.requirements.targetWordCount * 0.6)) {
    notes.push("Article is shorter than the requested length target");
  }
  if (new Set(article.sections.map((section) => section.heading.toLowerCase())).size !== article.sections.length) {
    notes.push("Section headings contain duplicates");
  }
  if (article.sourceInput.includeReferences && !(article.references?.length ?? 0)) {
    notes.push("References were requested but none were returned");
  }

  const textBlocks = [
    article.title,
    article.subtitle,
    article.excerpt,
    article.introduction,
    article.conclusion,
    article.callToAction,
    ...article.sections.flatMap((section) => [
      section.heading,
      section.summary,
      ...(section.h3Headings ?? []),
      ...(section.takeaways ?? []),
      ...section.paragraphs,
    ]),
    ...(article.references ?? []).flatMap((reference) => [reference.title, reference.source, reference.note]),
  ];

  if (
    textBlocks
      .filter((value): value is string => Boolean(value))
      .some((value) => containsBannedPhrase(value))
  ) {
    notes.push("Contains blocked filler or AI disclosure phrases");
  }

  return notes;
}

export function normalizeArticle(article: GeneratedArticle): GeneratedArticle {
  const sections = article.sections.map(sanitizeSection);
  const slug = slugify(article.slug || article.title || article.sourceInput.topic);
  const normalized: GeneratedArticle = {
    ...article,
    siteTitle: article.siteTitle.trim(),
    title: article.title.trim(),
    subtitle: article.subtitle.trim(),
    slug,
    excerpt: article.excerpt.trim(),
    introduction: article.introduction.trim(),
    sections,
    conclusion: article.conclusion.trim(),
    callToAction: article.callToAction.trim(),
    references: article.references?.map(sanitizeReference).filter((reference) => reference.title),
    seo: {
      ...article.seo,
      metaTitle: article.seo.metaTitle.trim(),
      metaDescription: article.seo.metaDescription.trim(),
      canonicalPath: `/${slug}`,
      focusKeyword: article.seo.focusKeyword.trim(),
      secondaryKeywords: article.seo.secondaryKeywords.map((keyword) => keyword.trim()).filter(Boolean),
      tags: article.seo.tags.map((tag) => tag.trim()).filter(Boolean),
      headingOutline: {
        h1: article.title.trim(),
        h2: sections.map((section) => section.heading),
        h3: sections.flatMap((section) => section.h3Headings ?? []),
      },
      suggestedInternalLinks: Array.from(
        new Set((article.seo.suggestedInternalLinks ?? ["/", `/${slug}`]).map((href) => href.trim()).filter(Boolean)),
      ),
    },
    requirements: {
      ...article.requirements,
      targetWordCount: targetWordCount(article.requirements.length),
      sectionCount: resolveSectionCount(article.requirements.length, article.requirements.sectionCount),
    },
    scheduledPublishAt: normalizeIsoTimestamp(article.scheduledPublishAt),
    publishedAt: normalizeIsoTimestamp(article.publishedAt),
  };

  const qualityNotes = collectArticleQualityNotes(normalized);
  normalized.metadata = {
    ...normalized.metadata,
    qualityStatus: qualityNotes.length > 0 ? "needs_review" : "ready",
    qualityNotes,
    referenceCount: normalized.references?.length ?? 0,
  };

  return normalized;
}

export function validateGeneratedArticle(article: GeneratedArticle): string[] {
  const errors: string[] = [];

  if (!article.title.trim()) errors.push("title is required");
  if (!article.subtitle.trim()) errors.push("subtitle is required");
  if (!article.slug.trim()) errors.push("slug is required");
  if (!article.excerpt.trim()) errors.push("excerpt is required");
  if (!article.introduction.trim()) errors.push("introduction is required");
  if (!article.conclusion.trim()) errors.push("conclusion is required");
  if (!article.sections.length) errors.push("sections must not be empty");

  article.sections.forEach((section, index) => {
    if (!section.heading.trim()) {
      errors.push(`sections[${index}].heading is required`);
    }
    if (section.paragraphs.length < MIN_SECTION_PARAGRAPHS) {
      errors.push(`sections[${index}] must include at least ${MIN_SECTION_PARAGRAPHS} paragraphs`);
    }
  });

  if (!article.seo.metaTitle.trim()) errors.push("seo.metaTitle is required");
  if (!article.seo.metaDescription.trim()) errors.push("seo.metaDescription is required");
  if (!article.seo.focusKeyword.trim()) errors.push("seo.focusKeyword is required");
  if (article.metadata.wordCount <= 0) errors.push("metadata.wordCount must be positive");

  article.references?.forEach((reference, index) => {
    if (!reference.title.trim()) {
      errors.push(`references[${index}].title is required`);
    }
    if (reference.url && !/^https?:\/\//i.test(reference.url)) {
      errors.push(`references[${index}].url must be an absolute URL`);
    }
  });

  return errors;
}
