import "server-only";

import { routes } from "@/config/routes";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import type { ContentLibraryItem } from "@/lib/content/library";
import { getSocialPostById, buildSocialPreviewResponse, upsertSocialPost, validateGeneratedSocialPost } from "@/lib/social";
import type {
  ReviewDetail,
  ReviewInlineEditPayload,
  ReviewListItem,
  ReviewListPage,
  ReviewQuery,
  ReviewRecord,
  ReviewState,
} from "./types";
import { REVIEW_MVP_BOUNDARIES, reviewScenarios } from "./scenarios";
import { getOwnedReviewRecord, listOwnedReviewRecords } from "./storage";

const MAX_SOURCE_SCAN = 5000;

function resolveReviewState(item: ContentLibraryItem, record: ReviewRecord | null): ReviewState {
  if (item.status === "published") {
    return "published";
  }

  return record?.state ?? "pending_review";
}

function toReviewListItem(item: ContentLibraryItem, record: ReviewRecord | null): ReviewListItem {
  const reviewState = resolveReviewState(item, record);

  return {
    contentId: item.id,
    item,
    reviewState,
    reviewNote: record?.decisionNote,
    publishReady: reviewState === "approved" || reviewState === "published",
  };
}

function paginate<T>(items: T[], page: number, perPage: number): { items: T[]; total: number; hasMore: boolean } {
  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    hasMore: start + perPage < total,
  };
}

async function listAllLibraryItemsForReview(userId: string, query: Pick<ReviewQuery, "search" | "sort" | "type">): Promise<ContentLibraryItem[]> {
  const page = await listOwnedContentLibraryPage(userId, {
    page: 1,
    perPage: MAX_SOURCE_SCAN,
    search: query.search,
    sort: query.sort,
    type: query.type,
    status: "all",
    websiteId: "all",
  });

  return page.items;
}

export async function listOwnedReviewPage(userId: string, query: ReviewQuery): Promise<ReviewListPage> {
  const [items, records] = await Promise.all([
    listAllLibraryItemsForReview(userId, query),
    listOwnedReviewRecords(userId),
  ]);

  const recordsByContentId = new Map(records.map((record) => [record.contentId, record]));

  const withReview = items
    .map((item) => toReviewListItem(item, recordsByContentId.get(item.id) ?? null))
    .filter((item) => (query.reviewState === "all" ? true : item.reviewState === query.reviewState));

  const paged = paginate(withReview, query.page, query.perPage);

  return {
    items: paged.items,
    total: paged.total,
    page: query.page,
    perPage: query.perPage,
    hasMore: paged.hasMore,
    scenarios: reviewScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...REVIEW_MVP_BOUNDARIES],
  };
}

export async function getOwnedReviewDetail(userId: string, contentId: string): Promise<ReviewDetail | null> {
  const [items, record] = await Promise.all([
    listAllLibraryItemsForReview(userId, { search: undefined, sort: "updated_desc", type: "all" }),
    getOwnedReviewRecord(userId, contentId),
  ]);

  const item = items.find((candidate) => candidate.id === contentId);
  if (!item) {
    return null;
  }

  const reviewState = resolveReviewState(item, record);
  const linkedStructureId = item.linkedWebsite?.structureId ?? item.quickActions.deleteStructureId;
  const canInlineEditContent = item.type === "social_post";
  const preview = {
    websitePreviewHref: linkedStructureId
      ? `${routes.previewSite(linkedStructureId)}${item.pageSlug ? `?page=${encodeURIComponent(item.pageSlug)}` : ""}`
      : undefined,
    socialPreview: undefined,
  };

  if (item.type === "social_post") {
    const socialPost = await getSocialPostById(item.sourceId, userId);
    if (socialPost) {
      preview.socialPreview = buildSocialPreviewResponse(socialPost);
    }
  }

  return {
    contentId,
    item,
    reviewState,
    reviewNote: record?.decisionNote,
    publishReady: reviewState === "approved" || reviewState === "published",
    preview,
    linkedStructureId,
    editHref: item.quickActions.editHref,
    canInlineEditContent,
    versionComparison: {
      supported: Boolean(linkedStructureId),
      href: linkedStructureId ? `${routes.generatedSite(linkedStructureId)}#versions` : undefined,
      note: linkedStructureId
        ? "Version comparison links to existing website version history; richer side-by-side review diff is future-ready."
        : "Version comparison is future-ready for content without structure-linked versions.",
    },
    commentsFeedback: {
      supported: true,
      note: "Single-note reviewer feedback is supported in MVP; threaded comments are future-ready.",
    },
  };
}

export async function applyOwnedInlineEdit(
  userId: string,
  contentId: string,
  payload: ReviewInlineEditPayload,
): Promise<{ ok: boolean; error?: string; validationErrors?: string[] }> {
  const detail = await getOwnedReviewDetail(userId, contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  if (detail.item.type !== "social_post") {
    return { ok: false, error: "Inline content editing is currently supported for social posts only." };
  }

  if (payload.socialTitle === undefined) {
    return { ok: true };
  }

  const socialPost = await getSocialPostById(detail.item.sourceId, userId);
  if (!socialPost) {
    return { ok: false, error: "Social post not found" };
  }

  const normalized = {
    ...socialPost,
    title: payload.socialTitle.trim() || socialPost.title,
    updatedAt: new Date().toISOString(),
    version: socialPost.version + 1,
  };

  const validationErrors = validateGeneratedSocialPost(normalized);
  if (validationErrors.length > 0) {
    return { ok: false, error: "Invalid social post draft", validationErrors };
  }

  await upsertSocialPost(normalized, userId);
  return { ok: true };
}
