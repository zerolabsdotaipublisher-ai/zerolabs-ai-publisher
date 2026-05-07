import type { ContentLibraryItem, ContentLibrarySort, ContentLibraryType } from "@/lib/content/library";

export type ApprovalState = "draft" | "pending_approval" | "approved" | "rejected" | "needs_changes" | "published";

export type PersistedApprovalDecisionState = "pending_review" | "approved" | "rejected" | "needs_changes";

export type ApprovalRole = "creator" | "reviewer" | "approver";

export interface ApprovalCommentRow {
  id: string;
  user_id: string;
  content_id: string;
  author_role: ApprovalRole;
  body: string;
  created_at: string;
}

export interface ApprovalComment {
  id: string;
  userId: string;
  contentId: string;
  authorRole: ApprovalRole;
  body: string;
  createdAt: string;
}

export interface ApprovalAuditRow {
  id: string;
  user_id: string;
  content_id: string;
  action: string;
  actor_role: ApprovalRole;
  note: string | null;
  metadata_json: unknown;
  created_at: string;
}

export interface ApprovalAuditEntry {
  id: string;
  userId: string;
  contentId: string;
  action: string;
  actorRole: ApprovalRole;
  note?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ApprovalListItem {
  contentId: string;
  item: ContentLibraryItem;
  approvalState: ApprovalState;
  publishReady: boolean;
  submitReady: boolean;
}

export interface ApprovalListPage {
  items: ApprovalListItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  scenarios: string[];
  mvpBoundaries: string[];
}

export interface ApprovalQuery {
  page: number;
  perPage: number;
  search?: string;
  type: ContentLibraryType | "all";
  sort: ContentLibrarySort;
  approvalState: ApprovalState | "all";
}

export interface ApprovalDetail {
  contentId: string;
  item: ContentLibraryItem;
  approvalState: ApprovalState;
  publishReady: boolean;
  submitReady: boolean;
  linkedStructureId?: string;
  reviewHref: string;
  editHref?: string;
  previewHref?: string;
  comments: ApprovalComment[];
  auditTrail: ApprovalAuditEntry[];
  notes: {
    workflow: string;
    multilevel: string;
  };
}

export interface ApprovalActionResult {
  ok: boolean;
  detail?: ApprovalDetail;
  error?: string;
}

export interface ApprovalListResponse extends ApprovalListPage {
  ok: boolean;
  error?: string;
}

export interface ApprovalPublishingGate {
  blocked: boolean;
  reason?: string;
  blockingStates: ApprovalState[];
  blockedContentIds: string[];
}
