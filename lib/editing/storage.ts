import "server-only";

import type { WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import {
  createArticleMetadata,
  getArticleByStructureId,
  normalizeArticle,
  upsertArticle,
  validateGeneratedArticle,
} from "@/lib/article";
import {
  createBlogMetadata,
  getBlogPostByStructureId,
  normalizeBlogPost,
  upsertBlogPost,
  validateGeneratedBlogPost,
} from "@/lib/blog";
import { getOwnedReviewDetail, upsertOwnedReviewRecord } from "@/lib/review";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { getWebsiteStructure, type WebsitePage } from "@/lib/ai/structure";
import { getSocialPostById, normalizeSocialPost, upsertSocialPost, validateGeneratedSocialPost } from "@/lib/social";
import type { GeneratedArticle } from "@/lib/article";
import type { GeneratedBlogPost } from "@/lib/blog";
import type { GeneratedSocialPost } from "@/lib/social";
import type { ReviewState } from "@/lib/review";
import { canEditOwnedContent } from "./permissions";
import { EDITING_MVP_BOUNDARIES, editingScenarios } from "./scenarios";
import type { EditableContentDraft, EditingDetail, SaveEditableContentResult } from "./types";
import { validateEditableDraft } from "./validation";

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function defaultSectionId(index: number): string {
  return `section_${index + 1}`;
}

function resolveWebsiteSectionHeading(section: WebsiteSection): string {
  const headline = section.content.headline;
  if (typeof headline === "string" && headline.trim()) {
    return headline;
  }

  const title = section.content.title;
  if (typeof title === "string" && title.trim()) {
    return title;
  }

  return section.type;
}

function buildWebsiteSectionBody(section: WebsiteSection): string {
  const content = section.content;

  if (typeof content.headline === "string" || typeof content.subheadline === "string") {
    return [content.headline, content.subheadline]
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .join("\n\n");
  }

  if (Array.isArray(content.paragraphs)) {
    return content.paragraphs.filter((entry): entry is string => typeof entry === "string").join("\n\n");
  }

  return stringifyUnknown(content);
}

function mapWebsiteDetailToDraft(
  detail: NonNullable<Awaited<ReturnType<typeof getOwnedReviewDetail>>>,
  structure: WebsiteStructure,
): EditableContentDraft {
  const pageSlug = detail.item.pageSlug || "/";
  const page = structure.pages.find((candidate) => candidate.slug === pageSlug) ?? structure.pages[0];

  const sections = page.sections.map((section, index) => ({
    id: section.id,
    heading: resolveWebsiteSectionHeading(section),
    body: buildWebsiteSectionBody(section),
    mediaUrl: typeof section.content.imageUrl === "string" ? section.content.imageUrl : undefined,
    order: section.order ?? index,
    visible: section.visible,
    rawJson: stringifyUnknown(section.content),
  }));

  return {
    contentId: detail.contentId,
    type: "website_page",
    sourceId: detail.item.sourceId,
    linkedStructureId: structure.id,
    title: page.title || detail.item.title,
    summary: page.seo.description || "",
    body: sections.map((section) => section.body).filter(Boolean).join("\n\n"),
    sections,
    media: {
      references: sections.map((section) => section.mediaUrl).filter((entry): entry is string => Boolean(entry)),
    },
    metadataSeo: {
      slug: page.slug,
      tags: page.seo.keywords,
      metaTitle: page.seo.title,
      metaDescription: page.seo.description,
      keywords: page.seo.keywords,
      canonicalUrl: page.seo.canonicalUrl,
    },
    reviewState: detail.reviewState,
    previewHref: detail.preview.websitePreviewHref,
    version: {
      version: structure.version,
      updatedAt: structure.updatedAt,
      snapshotSupport: "full",
    },
    capabilities: {
      inlineText: true,
      richText: true,
      sectionBlocks: true,
      media: true,
      metadataSeo: true,
      autosave: true,
      undoRedoFutureReady: true,
    },
    updatedAt: structure.updatedAt,
  };
}

function mapBlogDraft(detail: NonNullable<Awaited<ReturnType<typeof getOwnedReviewDetail>>>, blog: GeneratedBlogPost): EditableContentDraft {
  return {
    contentId: detail.contentId,
    type: "blog_post",
    sourceId: detail.item.sourceId,
    linkedStructureId: blog.structureId,
    title: blog.title,
    summary: blog.excerpt,
    body: [blog.introduction, ...blog.sections.flatMap((section) => section.paragraphs), blog.conclusion].filter(Boolean).join("\n\n"),
    sections: blog.sections.map((section, index) => ({
      id: section.id,
      heading: section.heading,
      body: [section.summary, ...section.paragraphs].filter(Boolean).join("\n\n"),
      order: index,
      visible: true,
      rawJson: stringifyUnknown(section),
    })),
    media: { references: [] },
    metadataSeo: {
      slug: blog.slug,
      tags: blog.seo.tags,
      metaTitle: blog.seo.metaTitle,
      metaDescription: blog.seo.metaDescription,
      keywords: blog.seo.secondaryKeywords,
      canonicalUrl: blog.seo.canonicalPath,
    },
    reviewState: detail.reviewState,
    previewHref: detail.preview.websitePreviewHref,
    version: {
      version: blog.version,
      updatedAt: blog.updatedAt,
      lastVersionId: blog.metadata.versionId,
      snapshotSupport: "hook",
    },
    capabilities: {
      inlineText: true,
      richText: true,
      sectionBlocks: true,
      media: true,
      metadataSeo: true,
      autosave: true,
      undoRedoFutureReady: true,
    },
    updatedAt: blog.updatedAt,
  };
}

function mapArticleDraft(detail: NonNullable<Awaited<ReturnType<typeof getOwnedReviewDetail>>>, article: GeneratedArticle): EditableContentDraft {
  return {
    contentId: detail.contentId,
    type: "article",
    sourceId: detail.item.sourceId,
    linkedStructureId: article.structureId,
    title: article.title,
    summary: article.excerpt,
    body: [article.introduction, ...article.sections.flatMap((section) => section.paragraphs), article.conclusion].filter(Boolean).join("\n\n"),
    sections: article.sections.map((section, index) => ({
      id: section.id,
      heading: section.heading,
      body: [section.summary, ...section.paragraphs].filter(Boolean).join("\n\n"),
      order: index,
      visible: true,
      rawJson: stringifyUnknown(section),
    })),
    media: { references: [] },
    metadataSeo: {
      slug: article.slug,
      tags: article.seo.tags,
      metaTitle: article.seo.metaTitle,
      metaDescription: article.seo.metaDescription,
      keywords: article.seo.secondaryKeywords,
      canonicalUrl: article.seo.canonicalPath,
    },
    reviewState: detail.reviewState,
    previewHref: detail.preview.websitePreviewHref,
    version: {
      version: article.version,
      updatedAt: article.updatedAt,
      lastVersionId: article.metadata.versionId,
      snapshotSupport: "hook",
    },
    capabilities: {
      inlineText: true,
      richText: true,
      sectionBlocks: true,
      media: true,
      metadataSeo: true,
      autosave: true,
      undoRedoFutureReady: true,
    },
    updatedAt: article.updatedAt,
  };
}

function mapSocialDraft(detail: NonNullable<Awaited<ReturnType<typeof getOwnedReviewDetail>>>, post: GeneratedSocialPost): EditableContentDraft {
  const sections = post.variants.map((variant, index) => ({
    id: variant.platform,
    heading: variant.platform.toUpperCase(),
    body: variant.caption,
    mediaUrl: variant.mediaReferences[0],
    order: index,
    visible: true,
    rawJson: stringifyUnknown(variant),
  }));

  return {
    contentId: detail.contentId,
    type: "social_post",
    sourceId: detail.item.sourceId,
    linkedStructureId: post.structureId,
    title: post.title,
    summary: post.topic,
    body: sections.map((section) => section.body).join("\n\n"),
    sections,
    media: {
      references: Array.from(new Set(post.variants.flatMap((variant) => variant.mediaReferences))).filter(Boolean),
    },
    metadataSeo: {
      tags: [],
      metaTitle: post.title,
      metaDescription: post.topic,
      keywords: post.sharedKeywords,
    },
    reviewState: detail.reviewState,
    previewHref: undefined,
    version: {
      version: post.version,
      updatedAt: post.updatedAt,
      snapshotSupport: "hook",
    },
    capabilities: {
      inlineText: true,
      richText: true,
      sectionBlocks: true,
      media: true,
      metadataSeo: true,
      autosave: true,
      undoRedoFutureReady: true,
    },
    updatedAt: post.updatedAt,
  };
}

function resolvePostEditReviewState(previousState: ReviewState): "pending_review" | "needs_changes" {
  // Keep explicit blocker states blocked until reviewer clears them.
  // All other states (pending_review/approved/published) re-enter pending_review after edits.
  if (previousState === "needs_changes" || previousState === "rejected") {
    return "needs_changes";
  }

  return "pending_review";
}

function resolvePostEditReviewUpdate(previousState: ReviewState, existingNote?: string) {
  const state = resolvePostEditReviewState(previousState);
  const decisionNote = previousState === "approved" || previousState === "published"
    ? "Content edited after approval; re-review required."
    : existingNote;

  return { state, decisionNote };
}

async function persistReviewAfterEdit(userId: string, detail: NonNullable<Awaited<ReturnType<typeof getOwnedReviewDetail>>>) {
  const update = resolvePostEditReviewUpdate(detail.reviewState, detail.reviewNote);
  await upsertOwnedReviewRecord({
    userId,
    contentId: detail.contentId,
    contentType: detail.item.type,
    sourceId: detail.item.sourceId,
    structureId: detail.linkedStructureId,
    state: update.state,
    decisionNote: update.decisionNote,
  });
}

function toWebsiteSectionContent(section: EditableContentDraft["sections"][number]): WebsiteSection["content"] {
  if (section.rawJson?.trim()) {
    try {
      const parsed = JSON.parse(section.rawJson);
      if (parsed && typeof parsed === "object") {
        return parsed as WebsiteSection["content"];
      }
    } catch {
      // fallback to text mapping
    }
  }

  const paragraphs = parseLines(section.body);
  return {
    headline: section.heading,
    paragraphs,
    imageUrl: section.mediaUrl,
  };
}

function applyWebsitePageDraft(page: WebsitePage, draft: EditableContentDraft): WebsitePage {
  const sectionMap = new Map(draft.sections.map((section) => [section.id, section]));

  const nextSections = page.sections.map((section, index) => {
    const incoming = sectionMap.get(section.id);
    if (!incoming) {
      return section;
    }

    return {
      ...section,
      order: incoming.order ?? index,
      visible: incoming.visible,
      content: toWebsiteSectionContent(incoming),
    };
  });

  const nextSlug = draft.metadataSeo.slug?.trim() || page.slug;
  const keywords = draft.metadataSeo.keywords.map((entry) => entry.trim()).filter(Boolean);

  return {
    ...page,
    title: draft.title.trim(),
    slug: nextSlug,
    sections: nextSections,
    seo: {
      ...page.seo,
      title: draft.metadataSeo.metaTitle.trim(),
      description: draft.metadataSeo.metaDescription.trim(),
      keywords,
      canonicalUrl: draft.metadataSeo.canonicalUrl?.trim() || page.seo.canonicalUrl,
    },
  };
}

async function saveWebsiteDraft(userId: string, draft: EditableContentDraft): Promise<SaveEditableContentResult> {
  if (!draft.linkedStructureId) {
    return { ok: false, error: "Website structure is required for website page editing." };
  }

  const structure = await getWebsiteStructure(draft.linkedStructureId, userId);
  if (!structure) {
    return { ok: false, error: "Website structure not found." };
  }

  const pageSlug = draft.metadataSeo.slug?.trim() || draft.metadataSeo.canonicalUrl || "/";
  const targetPage = structure.pages.find((page) => page.slug === pageSlug)
    ?? structure.pages.find((page) => page.slug === draft.metadataSeo.slug)
    ?? structure.pages[0];

  const updatedStructure = {
    ...structure,
    pages: structure.pages.map((page) => page.id === targetPage.id ? applyWebsitePageDraft(page, draft) : page),
  };

  const saveResult = await saveEditorStructureDraft(userId, updatedStructure);
  if (!saveResult.structure || saveResult.error) {
    return {
      ok: false,
      error: saveResult.error || "Unable to save website page draft.",
      validationIssues: saveResult.validationErrors.map((entry) => ({ field: entry.field, message: entry.message })),
    };
  }

  const detail = await loadOwnedEditingDetail(userId, draft.contentId);
  if (!detail) {
    return { ok: false, error: "Unable to refresh edited content." };
  }

  detail.draft.version.lastVersionId = saveResult.versionId;
  return { ok: true, detail };
}

async function saveBlogDraft(userId: string, draft: EditableContentDraft): Promise<SaveEditableContentResult> {
  if (!draft.linkedStructureId) {
    return { ok: false, error: "Blog structure is required." };
  }

  const existing = await getBlogPostByStructureId(draft.linkedStructureId, userId);
  if (!existing) {
    return { ok: false, error: "Blog not found." };
  }

  const sections = draft.sections.map((section, index) => {
    const raw = section.rawJson?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { h3Headings?: string[]; focusKeyword?: string };
        return {
          id: section.id,
          heading: section.heading.trim(),
          summary: parseLines(section.body)[0] ?? section.heading.trim(),
          paragraphs: parseLines(section.body),
          h3Headings: Array.isArray(parsed.h3Headings) ? parsed.h3Headings : [],
          focusKeyword: typeof parsed.focusKeyword === "string" ? parsed.focusKeyword : undefined,
        };
      } catch {
        // continue fallback
      }
    }

    const paragraphs = parseLines(section.body);
    return {
      id: section.id || defaultSectionId(index),
      heading: section.heading.trim(),
      summary: paragraphs[0] || section.heading.trim(),
      paragraphs,
      h3Headings: [],
      focusKeyword: undefined,
    };
  });

  const next = normalizeBlogPost({
    ...existing,
    title: draft.title.trim(),
    excerpt: draft.summary.trim() || existing.excerpt,
    introduction: existing.introduction,
    conclusion: existing.conclusion,
    sections,
    sourceInput: {
      ...existing.sourceInput,
      keywords: draft.metadataSeo.keywords,
      tags: draft.metadataSeo.tags,
    },
    seo: {
      ...existing.seo,
      metaTitle: draft.metadataSeo.metaTitle.trim(),
      metaDescription: draft.metadataSeo.metaDescription.trim(),
      secondaryKeywords: draft.metadataSeo.keywords,
      tags: draft.metadataSeo.tags,
      canonicalPath: draft.metadataSeo.canonicalUrl?.trim() || existing.seo.canonicalPath,
    },
    slug: draft.metadataSeo.slug?.trim() || existing.slug,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  });

  const validationErrors = validateGeneratedBlogPost(next);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      error: "Blog validation failed.",
      validationIssues: validationErrors.map((message) => ({ field: "blog", message })),
    };
  }

  await upsertBlogPost({
    ...next,
    metadata: createBlogMetadata({
      input: next.sourceInput,
      generatedAt: next.generatedAt,
      updatedAt: next.updatedAt,
      sections: next.sections,
      introduction: next.introduction,
      conclusion: next.conclusion,
      callToAction: next.callToAction,
      qualityNotes: next.metadata.qualityNotes,
      versionId: next.metadata.versionId,
    }),
  }, userId);

  const detail = await loadOwnedEditingDetail(userId, draft.contentId);
  if (!detail) {
    return { ok: false, error: "Unable to refresh edited blog." };
  }

  return { ok: true, detail };
}

async function saveArticleDraft(userId: string, draft: EditableContentDraft): Promise<SaveEditableContentResult> {
  if (!draft.linkedStructureId) {
    return { ok: false, error: "Article structure is required." };
  }

  const existing = await getArticleByStructureId(draft.linkedStructureId, userId);
  if (!existing) {
    return { ok: false, error: "Article not found." };
  }

  const sections = draft.sections.map((section, index) => {
    const paragraphs = parseLines(section.body);
    return {
      id: section.id || defaultSectionId(index),
      heading: section.heading.trim(),
      summary: paragraphs[0] || section.heading.trim(),
      paragraphs,
      h3Headings: [],
      takeaways: [],
      focusKeyword: undefined,
    };
  });

  const next = normalizeArticle({
    ...existing,
    title: draft.title.trim(),
    excerpt: draft.summary.trim() || existing.excerpt,
    introduction: existing.introduction,
    conclusion: existing.conclusion,
    sections,
    sourceInput: {
      ...existing.sourceInput,
      keywords: draft.metadataSeo.keywords,
      tags: draft.metadataSeo.tags,
    },
    seo: {
      ...existing.seo,
      metaTitle: draft.metadataSeo.metaTitle.trim(),
      metaDescription: draft.metadataSeo.metaDescription.trim(),
      secondaryKeywords: draft.metadataSeo.keywords,
      tags: draft.metadataSeo.tags,
      canonicalPath: draft.metadataSeo.canonicalUrl?.trim() || existing.seo.canonicalPath,
    },
    slug: draft.metadataSeo.slug?.trim() || existing.slug,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  });

  const validationErrors = validateGeneratedArticle(next);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      error: "Article validation failed.",
      validationIssues: validationErrors.map((message) => ({ field: "article", message })),
    };
  }

  await upsertArticle({
    ...next,
    metadata: createArticleMetadata({
      input: next.sourceInput,
      generatedAt: next.generatedAt,
      updatedAt: next.updatedAt,
      title: next.title,
      subtitle: next.subtitle,
      sections: next.sections,
      introduction: next.introduction,
      conclusion: next.conclusion,
      callToAction: next.callToAction,
      references: next.references,
      qualityNotes: next.metadata.qualityNotes,
      versionId: next.metadata.versionId,
    }),
  }, userId);

  const detail = await loadOwnedEditingDetail(userId, draft.contentId);
  if (!detail) {
    return { ok: false, error: "Unable to refresh edited article." };
  }

  return { ok: true, detail };
}

async function saveSocialDraft(userId: string, draft: EditableContentDraft): Promise<SaveEditableContentResult> {
  const existing = await getSocialPostById(draft.sourceId, userId);
  if (!existing) {
    return { ok: false, error: "Social post not found." };
  }

  const sectionById = new Map(draft.sections.map((section) => [section.id, section]));

  const variants = existing.variants.map((variant) => {
    const edited = sectionById.get(variant.platform);
    if (!edited) {
      return variant;
    }

    const mediaReferences = edited.mediaUrl
      ? [edited.mediaUrl, ...draft.media.references]
      : draft.media.references;

    return {
      ...variant,
      caption: edited.body.trim(),
      mediaReferences: Array.from(new Set(mediaReferences.map((entry) => entry.trim()).filter(Boolean))),
    };
  });

  const normalized = normalizeSocialPost({
    ...existing,
    title: draft.title.trim(),
    topic: draft.summary.trim() || existing.topic,
    sharedKeywords: draft.metadataSeo.keywords,
    variants,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  });

  const validationErrors = validateGeneratedSocialPost(normalized);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      error: "Social content validation failed.",
      validationIssues: validationErrors.map((message) => ({ field: "social", message })),
    };
  }

  await upsertSocialPost(normalized, userId);
  const detail = await loadOwnedEditingDetail(userId, draft.contentId);
  if (!detail) {
    return { ok: false, error: "Unable to refresh edited social post." };
  }

  return { ok: true, detail };
}

export async function loadOwnedEditingDetail(userId: string, contentId: string): Promise<EditingDetail | null> {
  const detail = await getOwnedReviewDetail(userId, contentId);
  const permission = canEditOwnedContent(detail);
  if (!permission.allowed || !detail) {
    return null;
  }

  let draft: EditableContentDraft;

  if (detail.item.type === "website_page") {
    if (!detail.linkedStructureId) {
      return null;
    }

    const structure = await getWebsiteStructure(detail.linkedStructureId, userId);
    if (!structure) {
      return null;
    }

    draft = mapWebsiteDetailToDraft(detail, structure);
  } else if (detail.item.type === "blog_post") {
    if (!detail.linkedStructureId) {
      return null;
    }

    const blog = await getBlogPostByStructureId(detail.linkedStructureId, userId);
    if (!blog) {
      return null;
    }

    draft = mapBlogDraft(detail, blog);
  } else if (detail.item.type === "article") {
    if (!detail.linkedStructureId) {
      return null;
    }

    const article = await getArticleByStructureId(detail.linkedStructureId, userId);
    if (!article) {
      return null;
    }

    draft = mapArticleDraft(detail, article);
  } else {
    const socialPost = await getSocialPostById(detail.item.sourceId, userId);
    if (!socialPost) {
      return null;
    }

    draft = mapSocialDraft(detail, socialPost);
  }

  return {
    draft,
    scenarios: editingScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...EDITING_MVP_BOUNDARIES],
  };
}

export async function saveOwnedEditableContent(
  userId: string,
  incomingDraft: EditableContentDraft,
): Promise<SaveEditableContentResult> {
  const detail = await getOwnedReviewDetail(userId, incomingDraft.contentId);
  const permission = canEditOwnedContent(detail);
  if (!permission.allowed || !detail) {
    return { ok: false, error: permission.reason || "Unauthorized" };
  }

  const validationIssues = validateEditableDraft(incomingDraft);
  if (validationIssues.length > 0) {
    return {
      ok: false,
      error: "Validation failed for edited content.",
      validationIssues,
    };
  }

  let saveResult: SaveEditableContentResult;
  if (incomingDraft.type === "website_page") {
    saveResult = await saveWebsiteDraft(userId, incomingDraft);
  } else if (incomingDraft.type === "blog_post") {
    saveResult = await saveBlogDraft(userId, incomingDraft);
  } else if (incomingDraft.type === "article") {
    saveResult = await saveArticleDraft(userId, incomingDraft);
  } else {
    saveResult = await saveSocialDraft(userId, incomingDraft);
  }

  if (!saveResult.ok) {
    return saveResult;
  }

  await persistReviewAfterEdit(userId, detail);
  const refreshed = await loadOwnedEditingDetail(userId, incomingDraft.contentId);

  return {
    ok: true,
    detail: refreshed ?? saveResult.detail,
  };
}
