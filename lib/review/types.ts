import type { ContentLibraryItem, ContentLibrarySort, ContentLibraryType } from "@/lib/content/library";
import type { SocialPreviewResponse } from "@/lib/social";

export type ReviewState = "pending_review" | "approved" | "rejected" | "needs_changes" | "published";

export type ReviewDecisionState = Exclude<ReviewState, "published">;

export interface ReviewRecordRow {
  user_id: string;
  content_id: string;
  content_type: ContentLibraryType;
  source_id: string;
  structure_id?: string | null;
  state: ReviewDecisionState;
  decision_note?: string | null;
  feedback_json?: unknown;
  approved_at?: string | null;
  rejected_at?: string | null;
  last_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRecord {
  userId: string;
  contentId: string;
  contentType: ContentLibraryType;
  sourceId: string;
  structureId?: string;
  state: ReviewDecisionState;
  decisionNote?: string;
  feedback?: Record<string, unknown>;
  approvedAt?: string;
  rejectedAt?: string;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListItem {
  contentId: string;
  item: ContentLibraryItem;
  reviewState: ReviewState;
  reviewNote?: string;
  publishReady: boolean;
}

export interface ReviewListPage {
  items: ReviewListItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  scenarios: string[];
  mvpBoundaries: string[];
}

export interface ReviewQuery {
  page: number;
  perPage: number;
  search?: string;
  type: ContentLibraryType | "all";
  sort: ContentLibrarySort;
  reviewState: ReviewState | "all";
}

export interface ReviewDetail {
  contentId: string;
  item: ContentLibraryItem;
  reviewState: ReviewState;
  reviewNote?: string;
  publishReady: boolean;
  preview: {
    websitePreviewHref?: string;
    socialPreview?: SocialPreviewResponse;
  };
  linkedStructureId?: string;
  editHref?: string;
  canInlineEditContent: boolean;
  versionComparison: {
    supported: boolean;
    href?: string;
    note: string;
  };
  commentsFeedback: {
    supported: boolean;
    note: string;
  };
}

export interface ReviewActionResponse {
  ok: boolean;
  detail?: ReviewDetail;
  error?: string;
}

export interface ReviewListResponse extends ReviewListPage {
  ok: boolean;
  error?: string;
}

export interface ReviewInlineEditPayload {
  reviewNote?: string;
  socialTitle?: string;
}

export interface ReviewInlineEditResponse {
  ok: boolean;
  detail?: ReviewDetail;
  validationErrors?: string[];
  error?: string;
}

export interface ReviewRegenerateResponse {
  ok: boolean;
  detail?: ReviewDetail;
  usedFallback?: boolean;
  validationErrors?: string[];
  error?: string;
}

export interface ReviewPublishingGate {
  blocked: boolean;
  reason?: string;
  blockingStates: ReviewDecisionState[];
}
