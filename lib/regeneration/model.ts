import "server-only";

import { getWebsiteStructure } from "@/lib/ai/structure";
import { getArticleByStructureId, type GeneratedArticle } from "@/lib/article";
import { getBlogPostByStructureId, type GeneratedBlogPost } from "@/lib/blog";
import { mapPersistedDecisionToApprovalState } from "@/lib/approval/schema";
import { getOwnedEditingWorkflowState } from "@/lib/editing/workflow";
import type { EditableContentDraft } from "@/lib/editing/types";
import { getOwnedReviewDetail } from "@/lib/review/model";
import { getOwnedReviewRecord } from "@/lib/review/storage";
import { getSocialPostById, type GeneratedSocialPost } from "@/lib/social";
import type { WebsiteStructure } from "@/lib/ai/structure";
import type { ReviewDetail } from "@/lib/review/types";
import type { RegenerationContextSummary } from "./types";

export type RegenerationSource =
  | { kind: "website"; structure: WebsiteStructure }
  | { kind: "blog"; blog: GeneratedBlogPost }
  | { kind: "article"; article: GeneratedArticle }
  | { kind: "social"; social: GeneratedSocialPost };

export interface RegenerationContext {
  userId: string;
  contentId: string;
  contentType: RegenerationContextSummary["contentType"];
  summary: RegenerationContextSummary;
  currentDraft: EditableContentDraft;
  reviewDetail: ReviewDetail;
  source: RegenerationSource;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));
}

export async function getOwnedRegenerationContext(userId: string, contentId: string): Promise<RegenerationContext | null> {
  const [reviewDetail, editing, record] = await Promise.all([
    getOwnedReviewDetail(userId, contentId),
    getOwnedEditingWorkflowState(userId, contentId),
    getOwnedReviewRecord(userId, contentId),
  ]);
  if (!reviewDetail || !editing) {
    return null;
  }

  const approvalState = reviewDetail.reviewState === "published"
    ? "published"
    : mapPersistedDecisionToApprovalState(record?.state ?? "pending_review");
  const currentDraft = editing.draft;

  let source: RegenerationSource | null = null;
  let tone: RegenerationContextSummary["tone"];
  let audience: RegenerationContextSummary["audience"];
  let keywords = reviewDetail.item.keywords;

  if (reviewDetail.item.type === "website_page" && reviewDetail.linkedStructureId) {
    const structure = await getWebsiteStructure(reviewDetail.linkedStructureId, userId);
    if (!structure) return null;
    source = { kind: "website", structure };
    tone = structure.styleConfig.tone;
    audience = structure.sourceInput.targetAudience;
    keywords = dedupe([...keywords, ...(structure.sourceInput.services ?? [])]);
  } else if (reviewDetail.item.type === "blog_post" && reviewDetail.linkedStructureId) {
    const blog = await getBlogPostByStructureId(reviewDetail.linkedStructureId, userId);
    if (!blog) return null;
    source = { kind: "blog", blog };
    tone = blog.requirements.tone;
    audience = blog.sourceInput.targetAudience;
    keywords = dedupe([...keywords, ...blog.sourceInput.keywords]);
  } else if (reviewDetail.item.type === "article" && reviewDetail.linkedStructureId) {
    const article = await getArticleByStructureId(reviewDetail.linkedStructureId, userId);
    if (!article) return null;
    source = { kind: "article", article };
    tone = article.requirements.tone;
    audience = article.sourceInput.targetAudience;
    keywords = dedupe([...keywords, ...article.sourceInput.keywords]);
  } else {
    const social = await getSocialPostById(reviewDetail.item.sourceId, userId);
    if (!social) return null;
    source = { kind: "social", social };
    tone = social.requirements.tone;
    audience = social.requirements.audience;
    keywords = dedupe([...keywords, ...social.sharedKeywords]);
  }

  return {
    userId,
    contentId,
    contentType: reviewDetail.item.type,
    summary: {
      contentId,
      contentType: reviewDetail.item.type,
      reviewState: reviewDetail.reviewState,
      approvalState,
      linkedStructureId: reviewDetail.linkedStructureId,
      linkedWebsite: reviewDetail.item.linkedWebsite?.title,
      linkedCampaign: reviewDetail.item.linkedCampaign,
      tone,
      audience,
      keywords,
      sectionOptions: currentDraft.sections.map((section) => ({ id: section.id, heading: section.heading })),
    },
    currentDraft,
    reviewDetail,
    source,
  };
}
