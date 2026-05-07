import "server-only";

import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure";
import {
  regenerateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import {
  getBlogPostByStructureId,
  regenerateBlogPost,
  normalizeBlogPost,
  collectBlogQualityNotes,
  upsertBlogPost,
  createBlogMetadata,
} from "@/lib/blog";
import {
  getArticleByStructureId,
  regenerateArticle,
  normalizeArticle,
  collectArticleQualityNotes,
  upsertArticle,
  createArticleMetadata,
} from "@/lib/article";
import { getSocialPostById, regenerateSocialPost, upsertSocialPost } from "@/lib/social";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { getOwnedReviewDetail } from "./model";
import { listOwnedStructureReviewRecords, upsertOwnedReviewRecord } from "./storage";
import type { ReviewDecisionState, ReviewPublishingGate, ReviewRegenerateResponse } from "./types";

export async function setOwnedReviewState(params: {
  userId: string;
  contentId: string;
  state: ReviewDecisionState;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const detail = await getOwnedReviewDetail(params.userId, params.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  await upsertOwnedReviewRecord({
    userId: params.userId,
    contentId: params.contentId,
    contentType: detail.item.type,
    sourceId: detail.item.sourceId,
    structureId: detail.linkedStructureId,
    state: params.state,
    decisionNote: params.note,
  });

  return { ok: true };
}

export async function regenerateOwnedReviewContent(params: {
  userId: string;
  contentId: string;
}): Promise<ReviewRegenerateResponse> {
  const detail = await getOwnedReviewDetail(params.userId, params.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  if (detail.item.type === "website_page") {
    const structureId = detail.linkedStructureId;
    if (!structureId) {
      return { ok: false, error: "Website structure is required for regeneration" };
    }

    const structure = await getWebsiteStructure(structureId, params.userId);
    if (!structure) {
      return { ok: false, error: "Structure not found" };
    }

    const options: ContentGenerationOptions = detail.item.pageSlug
      ? { pages: [detail.item.pageSlug] }
      : {};

    const result = await regenerateWebsiteContent(structure, params.userId, undefined, options);
    const seoResult = await generateWebsiteSeo(result.mappedStructure.sourceInput, result.mappedStructure, params.userId, {
      version: result.mappedStructure.version,
      pages: options.pages,
    });

    await storeWebsiteGeneratedContent(result.content);
    const updatedStructure = await updateWebsiteStructure(seoResult.mappedStructure);
    await storeWebsiteNavigation({
      structureId: updatedStructure.id,
      userId: params.userId,
      navigation: updatedStructure.navigation,
      version: updatedStructure.version,
      createdAt: updatedStructure.generatedAt,
      updatedAt: updatedStructure.updatedAt,
    });
    await storeWebsiteSeoMetadata({
      ...seoResult.seo,
      structureId: updatedStructure.id,
      version: updatedStructure.version,
      updatedAt: updatedStructure.updatedAt,
    });

    return {
      ok: true,
      detail: await getOwnedReviewDetail(params.userId, params.contentId) ?? undefined,
      usedFallback: result.usedFallback || seoResult.usedFallback,
      validationErrors: [...result.validationErrors, ...seoResult.validationErrors],
    };
  }

  if (detail.item.type === "blog_post") {
    const structureId = detail.linkedStructureId;
    if (!structureId) {
      return { ok: false, error: "Blog structure is required for regeneration" };
    }

    const existingBlog = await getBlogPostByStructureId(structureId, params.userId);
    if (!existingBlog) {
      return { ok: false, error: "Blog not found" };
    }

    const regenerated = await regenerateBlogPost(existingBlog, params.userId, {
      scope: "full",
      updatedInput: undefined,
    });

    const draftSave = await saveEditorStructureDraft(params.userId, regenerated.structure);
    if (!draftSave.structure || draftSave.error) {
      return {
        ok: false,
        error: draftSave.error || "Unable to persist regenerated blog structure",
        validationErrors: draftSave.validationErrors.map((entry) => entry.message),
      };
    }

    const normalizedBlog = normalizeBlogPost({
      ...regenerated.blog,
      structureId: draftSave.structure.id,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
    });

    const qualityNotes = collectBlogQualityNotes(normalizedBlog);
    await upsertBlogPost(
      {
        ...normalizedBlog,
        metadata: createBlogMetadata({
          input: normalizedBlog.sourceInput,
          generatedAt: normalizedBlog.generatedAt,
          updatedAt: normalizedBlog.updatedAt,
          sections: normalizedBlog.sections,
          introduction: normalizedBlog.introduction,
          conclusion: normalizedBlog.conclusion,
          callToAction: normalizedBlog.callToAction,
          qualityNotes,
          versionId: draftSave.versionId ?? normalizedBlog.metadata.versionId,
        }),
      },
      params.userId,
    );

    return {
      ok: true,
      detail: await getOwnedReviewDetail(params.userId, params.contentId) ?? undefined,
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    };
  }

  if (detail.item.type === "article") {
    const structureId = detail.linkedStructureId;
    if (!structureId) {
      return { ok: false, error: "Article structure is required for regeneration" };
    }

    const existingArticle = await getArticleByStructureId(structureId, params.userId);
    if (!existingArticle) {
      return { ok: false, error: "Article not found" };
    }

    const regenerated = await regenerateArticle(existingArticle, params.userId, {
      scope: "full",
      updatedInput: undefined,
    });

    const draftSave = await saveEditorStructureDraft(params.userId, regenerated.structure);
    if (!draftSave.structure || draftSave.error) {
      return {
        ok: false,
        error: draftSave.error || "Unable to persist regenerated article structure",
        validationErrors: draftSave.validationErrors.map((entry) => entry.message),
      };
    }

    const normalizedArticle = normalizeArticle({
      ...regenerated.article,
      structureId: draftSave.structure.id,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
    });

    const qualityNotes = collectArticleQualityNotes(normalizedArticle);
    await upsertArticle(
      {
        ...normalizedArticle,
        metadata: createArticleMetadata({
          input: normalizedArticle.sourceInput,
          generatedAt: normalizedArticle.generatedAt,
          updatedAt: normalizedArticle.updatedAt,
          title: normalizedArticle.title,
          subtitle: normalizedArticle.subtitle,
          sections: normalizedArticle.sections,
          introduction: normalizedArticle.introduction,
          conclusion: normalizedArticle.conclusion,
          callToAction: normalizedArticle.callToAction,
          references: normalizedArticle.references,
          qualityNotes,
          versionId: draftSave.versionId ?? normalizedArticle.metadata.versionId,
        }),
      },
      params.userId,
    );

    return {
      ok: true,
      detail: await getOwnedReviewDetail(params.userId, params.contentId) ?? undefined,
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    };
  }

  const existingPost = await getSocialPostById(detail.item.sourceId, params.userId);
  if (!existingPost) {
    return { ok: false, error: "Social post not found" };
  }

  const regeneratedSocial = await regenerateSocialPost(existingPost, params.userId, {
    updatedInput: undefined,
  });
  await upsertSocialPost(regeneratedSocial.socialPost, params.userId);

  return {
    ok: true,
    detail: await getOwnedReviewDetail(params.userId, params.contentId) ?? undefined,
    usedFallback: regeneratedSocial.usedFallback,
    validationErrors: regeneratedSocial.validationErrors,
  };
}

export async function getStructureReviewPublishingGate(userId: string, structureId: string): Promise<ReviewPublishingGate> {
  const records = await listOwnedStructureReviewRecords(userId, structureId);
  const blockingStates = records
    .map((record) => record.state)
    .filter((state): state is "rejected" | "needs_changes" => state === "rejected" || state === "needs_changes");

  if (blockingStates.length > 0) {
    return {
      blocked: true,
      reason: "Publishing is blocked because linked review decisions require changes or are rejected.",
      blockingStates,
    };
  }

  return {
    blocked: false,
    blockingStates: [],
  };
}
