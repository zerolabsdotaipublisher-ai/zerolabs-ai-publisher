import type { ContentLibrarySort, ContentLibraryType } from "@/lib/content/library";
import type { ReviewDecisionState, ReviewQuery, ReviewState } from "./types";

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

const VALID_REVIEW_STATES: Array<ReviewState | "all"> = [
  "all",
  "pending_review",
  "approved",
  "rejected",
  "needs_changes",
  "published",
];

const VALID_DECISION_STATES: ReviewDecisionState[] = ["pending_review", "approved", "rejected", "needs_changes"];

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(1, parsed);
}

export function parseReviewQuery(params: URLSearchParams): ReviewQuery {
  const rawType = params.get("type") ?? "all";
  const rawSort = params.get("sort") ?? "updated_desc";
  const rawReviewState = params.get("reviewState") ?? "all";

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
    reviewState: VALID_REVIEW_STATES.includes(rawReviewState as ReviewState | "all")
      ? (rawReviewState as ReviewState | "all")
      : "all",
  };
}

export function parseDecisionState(value: unknown): ReviewDecisionState | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return VALID_DECISION_STATES.includes(value as ReviewDecisionState)
    ? (value as ReviewDecisionState)
    : undefined;
}

export function normalizeContentIdParam(value: string): string {
  return decodeURIComponent(value).trim();
}
