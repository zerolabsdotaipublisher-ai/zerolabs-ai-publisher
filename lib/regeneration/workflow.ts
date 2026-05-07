import "server-only";

import { regenerateWebsiteContent } from "@/lib/ai/content";
import type { WebsitePage, WebsiteSection } from "@/lib/ai/structure";
import { regenerateArticle } from "@/lib/article";
import { regenerateBlogPost } from "@/lib/blog";
import { saveOwnedEditableContent } from "@/lib/editing/storage";
import type { EditableContentDraft } from "@/lib/editing/types";
import { canRegenerateOwnedContent } from "@/lib/regeneration/permissions";
import { toRevisionWorkflowIdMap } from "@/lib/revisions/model";
import { recordContentRevisionAction } from "@/lib/revisions/workflow";
import { regenerateSocialPost } from "@/lib/social";
import { emitRegenerationMetric } from "./metrics";
import { getOwnedRegenerationContext } from "./model";
import {
  applyModeToArticleInput,
  applyModeToBlogInput,
  applyModeToSocialInput,
  applyModeToWebsiteInput,
  buildRegenerationConstraint,
} from "./prompts";
import type { RegenerationApplyResult, RegenerationPreviewResult, RegenerationRequest } from "./types";
import { summarizeRegenerationDiff, validateRegeneratedDraft } from "./validation";

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resolveWebsiteSectionHeading(section: WebsiteSection): string {
  const headline = section.content.headline;
  if (typeof headline === "string" && headline.trim()) return headline;
  const title = section.content.title;
  if (typeof title === "string" && title.trim()) return title;
  return section.type;
}

function buildWebsiteSectionBody(section: WebsiteSection): string {
  if (typeof section.content.headline === "string" || typeof section.content.subheadline === "string") {
    return [section.content.headline, section.content.subheadline]
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .join("\n\n");
  }
  if (Array.isArray(section.content.paragraphs)) {
    return section.content.paragraphs.filter((entry): entry is string => typeof entry === "string").join("\n\n");
  }
  return stringifyUnknown(section.content);
}

function mapWebsitePageToDraft(base: EditableContentDraft, page: WebsitePage, version: number, updatedAt: string): EditableContentDraft {
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
    ...base,
    title: page.title || base.title,
    summary: page.seo.description || base.summary,
    body: sections.map((section) => section.body).filter(Boolean).join("\n\n"),
    sections,
    media: {
      references: sections.map((section) => section.mediaUrl).filter((entry): entry is string => Boolean(entry)),
    },
    metadataSeo: {
      ...base.metadataSeo,
      slug: page.slug,
      tags: page.seo.keywords,
      metaTitle: page.seo.title,
      metaDescription: page.seo.description,
      keywords: page.seo.keywords,
      canonicalUrl: page.seo.canonicalUrl,
    },
    version: {
      ...base.version,
      version,
      updatedAt,
    },
    updatedAt,
  };
}

function mapBlogToDraft(base: EditableContentDraft, regenerated: Awaited<ReturnType<typeof regenerateBlogPost>>["blog"]): EditableContentDraft {
  const sections = regenerated.sections.map((section, index) => ({
    id: section.id,
    heading: section.heading,
    body: [section.summary, ...section.paragraphs].filter(Boolean).join("\n\n"),
    order: index,
    visible: true,
    rawJson: stringifyUnknown(section),
  }));

  return {
    ...base,
    title: regenerated.title,
    summary: regenerated.excerpt,
    body: [regenerated.introduction, ...regenerated.sections.flatMap((section) => section.paragraphs), regenerated.conclusion]
      .filter(Boolean)
      .join("\n\n"),
    sections,
    metadataSeo: {
      ...base.metadataSeo,
      slug: regenerated.slug,
      tags: regenerated.seo.tags,
      metaTitle: regenerated.seo.metaTitle,
      metaDescription: regenerated.seo.metaDescription,
      keywords: regenerated.seo.secondaryKeywords,
      canonicalUrl: regenerated.seo.canonicalPath,
    },
    version: {
      ...base.version,
      version: regenerated.version,
      updatedAt: regenerated.updatedAt,
    },
    updatedAt: regenerated.updatedAt,
  };
}

function mapArticleToDraft(base: EditableContentDraft, regenerated: Awaited<ReturnType<typeof regenerateArticle>>["article"]): EditableContentDraft {
  const sections = regenerated.sections.map((section, index) => ({
    id: section.id,
    heading: section.heading,
    body: [section.summary, ...section.paragraphs].filter(Boolean).join("\n\n"),
    order: index,
    visible: true,
    rawJson: stringifyUnknown(section),
  }));

  return {
    ...base,
    title: regenerated.title,
    summary: regenerated.excerpt,
    body: [regenerated.introduction, ...regenerated.sections.flatMap((section) => section.paragraphs), regenerated.conclusion]
      .filter(Boolean)
      .join("\n\n"),
    sections,
    metadataSeo: {
      ...base.metadataSeo,
      slug: regenerated.slug,
      tags: regenerated.seo.tags,
      metaTitle: regenerated.seo.metaTitle,
      metaDescription: regenerated.seo.metaDescription,
      keywords: regenerated.seo.secondaryKeywords,
      canonicalUrl: regenerated.seo.canonicalPath,
    },
    version: {
      ...base.version,
      version: regenerated.version,
      updatedAt: regenerated.updatedAt,
    },
    updatedAt: regenerated.updatedAt,
  };
}

function mapSocialToDraft(base: EditableContentDraft, regenerated: Awaited<ReturnType<typeof regenerateSocialPost>>["socialPost"]): EditableContentDraft {
  const sections = regenerated.variants.map((variant, index) => ({
    id: variant.platform,
    heading: variant.platform.toUpperCase(),
    body: variant.caption,
    mediaUrl: variant.mediaReferences[0],
    order: index,
    visible: true,
    rawJson: stringifyUnknown(variant),
  }));

  return {
    ...base,
    title: regenerated.title,
    summary: regenerated.topic,
    body: sections.map((section) => section.body).join("\n\n"),
    sections,
    media: {
      references: Array.from(new Set(regenerated.variants.flatMap((variant) => variant.mediaReferences))).filter(Boolean),
    },
    metadataSeo: {
      ...base.metadataSeo,
      metaTitle: regenerated.title,
      metaDescription: regenerated.topic,
      keywords: regenerated.sharedKeywords,
    },
    version: {
      ...base.version,
      version: regenerated.version,
      updatedAt: regenerated.updatedAt,
    },
    updatedAt: regenerated.updatedAt,
  };
}

function replaceSection(base: EditableContentDraft, candidate: EditableContentDraft, sectionId: string): EditableContentDraft {
  const regeneratedSection = candidate.sections.find((section) => section.id === sectionId);
  if (!regeneratedSection) {
    return base;
  }

  const nextSections = base.sections.map((section) => (section.id === sectionId ? regeneratedSection : section));
  const body = nextSections.map((section) => section.body).filter(Boolean).join("\n\n");
  return {
    ...base,
    sections: nextSections,
    body,
    media: {
      references: Array.from(new Set(nextSections.map((section) => section.mediaUrl).filter((entry): entry is string => Boolean(entry)))),
    },
  };
}

function applyFieldLevel(base: EditableContentDraft, candidate: EditableContentDraft, request: RegenerationRequest): EditableContentDraft {
  const field = request.target.fieldKey;
  if (field === "headline" || field === "title") {
    return { ...base, title: candidate.title };
  }
  if (field === "summary") {
    return { ...base, summary: candidate.summary };
  }

  const sectionId = request.target.sectionId ?? base.sections[0]?.id;
  if (!sectionId) {
    return base;
  }

  const sourceSection = candidate.sections.find((section) => section.id === sectionId) ?? candidate.sections[0];
  if (!sourceSection) {
    return base;
  }
  const next = replaceSection(base, { ...base, sections: [sourceSection] }, sectionId);
  if (field === "caption") {
    return { ...next, body: next.sections.map((section) => section.body).join("\n\n") };
  }
  if (field === "cta") {
    return { ...next, summary: candidate.summary || next.summary };
  }
  return next;
}

function applyRegenerationScope(base: EditableContentDraft, candidate: EditableContentDraft, request: RegenerationRequest): EditableContentDraft {
  if (request.level === "full") {
    return candidate;
  }
  if (request.level === "section" && request.target.sectionId) {
    return replaceSection(base, candidate, request.target.sectionId);
  }
  return applyFieldLevel(base, candidate, request);
}

async function buildRegeneratedDraft(input: {
  request: RegenerationRequest;
  context: Awaited<ReturnType<typeof getOwnedRegenerationContext>> extends infer T ? NonNullable<T> : never;
}): Promise<{ regeneratedDraft: EditableContentDraft; usedFallback: boolean; validationErrors: string[] }> {
  const { context, request } = input;

  if (context.source.kind === "website") {
    const pageSlug = context.currentDraft.metadataSeo.slug || "/";
    const regenerated = await regenerateWebsiteContent(
      context.source.structure,
      context.userId,
      applyModeToWebsiteInput(context.source.structure.sourceInput, request),
      { pages: [pageSlug] },
    );
    const regeneratedPage = regenerated.mappedStructure.pages.find((page) => page.slug === pageSlug) ?? regenerated.mappedStructure.pages[0];
    return {
      regeneratedDraft: mapWebsitePageToDraft(
        context.currentDraft,
        regeneratedPage,
        regenerated.mappedStructure.version,
        regenerated.mappedStructure.updatedAt,
      ),
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    };
  }

  if (context.source.kind === "blog") {
    const regenerated = await regenerateBlogPost(context.source.blog, context.userId, {
      scope: request.level === "section" && request.target.sectionId ? "section" : "full",
      sectionId: request.target.sectionId,
      updatedInput: applyModeToBlogInput(context.source.blog.sourceInput, request),
    });
    return {
      regeneratedDraft: mapBlogToDraft(context.currentDraft, regenerated.blog),
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    };
  }

  if (context.source.kind === "article") {
    const regenerated = await regenerateArticle(context.source.article, context.userId, {
      scope: request.level === "section" && request.target.sectionId ? "section" : "full",
      sectionId: request.target.sectionId,
      updatedInput: applyModeToArticleInput(context.source.article.sourceInput, request),
    });
    return {
      regeneratedDraft: mapArticleToDraft(context.currentDraft, regenerated.article),
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    };
  }

  const socialRegenerated = await regenerateSocialPost(context.source.social, context.userId, {
    platform: request.level === "section" ? (request.target.sectionId as "facebook" | "instagram" | "x" | "linkedin" | undefined) : undefined,
    reason: buildRegenerationConstraint(request),
    updatedInput: applyModeToSocialInput(
      {
        topic: context.source.social.topic,
        keywords: context.source.social.sharedKeywords,
        campaignGoal: context.source.social.requirements.campaignGoal,
        audience: context.source.social.requirements.audience,
        tone: context.source.social.requirements.tone,
        platforms: context.source.social.requirements.platforms,
      },
      request,
    ),
  });
  return {
    regeneratedDraft: mapSocialToDraft(context.currentDraft, socialRegenerated.socialPost),
    usedFallback: socialRegenerated.usedFallback,
    validationErrors: socialRegenerated.validationErrors,
  };
}

export async function runRegenerationPreviewWorkflow(input: {
  userId: string;
  contentId: string;
  request: RegenerationRequest;
}): Promise<RegenerationPreviewResult> {
  const context = await getOwnedRegenerationContext(input.userId, input.contentId);
  const permission = canRegenerateOwnedContent(context?.reviewDetail ?? null);
  if (!context || !permission.allowed) {
    return { ok: false, error: permission.reason || "Content not found", request: input.request, validationErrors: [] };
  }

  await emitRegenerationMetric({
    event: "regeneration_started",
    userId: input.userId,
    contentId: input.contentId,
    contentType: context.contentType,
    mode: input.request.mode,
    level: input.request.level,
    status: "started",
  });

  try {
    const generated = await buildRegeneratedDraft({ context, request: input.request });
    const scopedDraft = applyRegenerationScope(context.currentDraft, generated.regeneratedDraft, input.request);
    const validationErrors = [...generated.validationErrors, ...validateRegeneratedDraft(context.currentDraft, scopedDraft)];
    const compare = summarizeRegenerationDiff(context.currentDraft, scopedDraft);

    await emitRegenerationMetric({
      event: "regeneration_succeeded",
      userId: input.userId,
      contentId: input.contentId,
      contentType: context.contentType,
      mode: input.request.mode,
      level: input.request.level,
      status: "succeeded",
    });

    return {
      ok: true,
      request: input.request,
      summary: context.summary,
      compare,
      validationErrors,
      regeneratedDraft: scopedDraft,
      usedFallback: generated.usedFallback,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Regeneration failed";
    await emitRegenerationMetric({
      event: "regeneration_failed",
      userId: input.userId,
      contentId: input.contentId,
      contentType: context.contentType,
      mode: input.request.mode,
      level: input.request.level,
      status: "failed",
      error: message,
    });
    return {
      ok: false,
      request: input.request,
      summary: context.summary,
      compare: summarizeRegenerationDiff(context.currentDraft, context.currentDraft),
      validationErrors: [],
      regeneratedDraft: context.currentDraft,
      error: message,
    };
  }
}

export async function runRegenerationApplyWorkflow(input: {
  userId: string;
  contentId: string;
  request: RegenerationRequest;
  regeneratedDraft: EditableContentDraft;
}): Promise<RegenerationApplyResult> {
  const context = await getOwnedRegenerationContext(input.userId, input.contentId);
  const permission = canRegenerateOwnedContent(context?.reviewDetail ?? null);
  if (!context || !permission.allowed) {
    return { ok: false, error: permission.reason || "Content not found", request: input.request, validationErrors: [] };
  }

  if (input.regeneratedDraft.contentId !== input.contentId || input.regeneratedDraft.type !== context.currentDraft.type) {
    return {
      ok: false,
      error: "regeneratedDraft does not match target content",
      request: input.request,
      summary: context.summary,
      compare: summarizeRegenerationDiff(context.currentDraft, context.currentDraft),
      validationErrors: [],
    };
  }

  const validationErrors = validateRegeneratedDraft(context.currentDraft, input.regeneratedDraft);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      error: "Regenerated draft validation failed",
      request: input.request,
      summary: context.summary,
      compare: summarizeRegenerationDiff(context.currentDraft, input.regeneratedDraft),
      validationErrors,
      regeneratedDraft: input.regeneratedDraft,
    };
  }

  const saveResult = await saveOwnedEditableContent(input.userId, input.regeneratedDraft);
  if (!saveResult.ok) {
    return {
      ok: false,
      error: saveResult.error || "Unable to apply regenerated draft",
      request: input.request,
      summary: context.summary,
      compare: summarizeRegenerationDiff(context.currentDraft, input.regeneratedDraft),
      validationErrors: saveResult.validationIssues?.map((issue) => `${issue.field}: ${issue.message}`) ?? [],
      regeneratedDraft: input.regeneratedDraft,
    };
  }

  await recordContentRevisionAction({
    userId: input.userId,
    contentId: input.contentId,
    actionType: "ai_regenerate",
    relatedWorkflowIds: toRevisionWorkflowIdMap(),
    metadata: {
      level: input.request.level,
      mode: input.request.mode,
      target: input.request.target,
    },
  });

  await emitRegenerationMetric({
    event: "regeneration_applied",
    userId: input.userId,
    contentId: input.contentId,
    contentType: context.contentType,
    mode: input.request.mode,
    level: input.request.level,
    status: "applied",
  });

  return {
    ok: true,
    request: input.request,
    summary: context.summary,
    compare: summarizeRegenerationDiff(context.currentDraft, input.regeneratedDraft),
    validationErrors: [],
    regeneratedDraft: input.regeneratedDraft,
  };
}
