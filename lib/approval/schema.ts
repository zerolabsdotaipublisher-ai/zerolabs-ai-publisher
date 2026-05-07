import type { ContentLibrarySort, ContentLibraryType } from "@/lib/content/library";
import type { ApprovalQuery, ApprovalRole, ApprovalState, PersistedApprovalDecisionState } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 50;

const VALID_TYPES: Array<ContentLibraryType | "all"> = [
  "all",
  "website_page",
  "blog_post",
  "article",
  "social_post",
];

const VALID_SORTS: ContentLibrarySort[] = ["updated_desc", "created_desc", "title_asc"];

const VALID_STATES: Array<ApprovalState | "all"> = [
  "all",
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "needs_changes",
  "published",
];

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(1, parsed);
}

export function parseApprovalQuery(params: URLSearchParams): ApprovalQuery {
  const rawType = params.get("type") ?? "all";
  const rawSort = params.get("sort") ?? "updated_desc";
  const rawState = params.get("approvalState") ?? "all";

  return {
    page: parsePositiveInt(params.get("page"), DEFAULT_PAGE),
    perPage: Math.min(MAX_PER_PAGE, parsePositiveInt(params.get("perPage"), DEFAULT_PER_PAGE)),
    search: params.get("search")?.trim() || undefined,
    type: VALID_TYPES.includes(rawType as ContentLibraryType | "all")
      ? (rawType as ContentLibraryType | "all")
      : "all",
    sort: VALID_SORTS.includes(rawSort as ContentLibrarySort)
      ? (rawSort as ContentLibrarySort)
      : "updated_desc",
    approvalState: VALID_STATES.includes(rawState as ApprovalState | "all")
      ? (rawState as ApprovalState | "all")
      : "all",
  };
}

export function normalizeApprovalContentIdParam(value: string): string {
  return decodeURIComponent(value).trim();
}

export function mapPersistedDecisionToApprovalState(state: PersistedApprovalDecisionState): ApprovalState {
  if (state === "pending_review") {
    return "pending_approval";
  }

  return state;
}

export function mapApprovalStateToPersistedDecision(state: ApprovalState): PersistedApprovalDecisionState | undefined {
  if (state === "pending_approval") return "pending_review";
  if (state === "approved" || state === "rejected" || state === "needs_changes") return state;
  return undefined;
}

export function mapReviewStateToApprovalState(
  state: "pending_review" | "approved" | "rejected" | "needs_changes" | "published",
): ApprovalState {
  if (state === "pending_review") {
    return "pending_approval";
  }

  return state;
}

export function normalizeApprovalRole(value: unknown): ApprovalRole {
  if (value === "reviewer" || value === "approver") {
    return value;
  }

  return "creator";
}
