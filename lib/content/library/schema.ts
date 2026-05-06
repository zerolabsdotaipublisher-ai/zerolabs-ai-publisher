import type { ContentLibraryQuery, ContentLibrarySort, ContentLibraryStatus, ContentLibraryType } from "./types";

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
const VALID_STATUSES: Array<ContentLibraryStatus | "all"> = [
  "all",
  "draft",
  "generated",
  "edited",
  "scheduled",
  "published",
  "archived",
  "deleted",
  "failed",
  "unknown",
];
const VALID_SORTS: ContentLibrarySort[] = ["updated_desc", "created_desc", "title_asc"];

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(1, parsed);
}

export function parseContentLibraryQuery(params: URLSearchParams): ContentLibraryQuery {
  const rawType = params.get("type") ?? "all";
  const rawStatus = params.get("status") ?? "all";
  const rawSort = params.get("sort") ?? "updated_desc";
  const rawWebsiteId = params.get("websiteId")?.trim() || "all";

  return {
    page: parsePositiveInt(params.get("page"), DEFAULT_PAGE),
    perPage: Math.min(MAX_PER_PAGE, parsePositiveInt(params.get("perPage"), DEFAULT_PER_PAGE)),
    search: params.get("search")?.trim() || undefined,
    type: VALID_TYPES.includes(rawType as ContentLibraryType | "all")
      ? (rawType as ContentLibraryType | "all")
      : "all",
    status: VALID_STATUSES.includes(rawStatus as ContentLibraryStatus | "all")
      ? (rawStatus as ContentLibraryStatus | "all")
      : "all",
    websiteId: rawWebsiteId,
    sort: VALID_SORTS.includes(rawSort as ContentLibrarySort)
      ? (rawSort as ContentLibrarySort)
      : "updated_desc",
  };
}
