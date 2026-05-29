import type {
  PublishingActivityContentType,
  PublishingActivityPlatform,
  PublishingActivityQuery,
  PublishingActivitySegment,
  PublishingActivityStatus,
} from "./types";

const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 200;

const VALID_PLATFORMS: Array<PublishingActivityPlatform | "all"> = [
  "all",
  "website",
  "instagram",
  "facebook",
  "linkedin",
  "x",
];

const VALID_STATUSES: Array<PublishingActivityStatus | "all"> = [
  "all",
  "published",
  "scheduled",
  "failed",
  "publishing",
  "retry_pending",
  "canceled",
];

const VALID_CONTENT_TYPES: Array<PublishingActivityContentType | "all"> = [
  "all",
  "website",
  "website_page",
  "blog",
  "article",
  "social_post",
];

const VALID_SEGMENTS: PublishingActivitySegment[] = ["all", "recent", "upcoming", "attention"];

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(MAX_LIMIT, Math.max(1, parsed));
}

function parseDate(value: string | null): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.trim();
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString();
}

export function parsePublishingActivityQuery(params: URLSearchParams): PublishingActivityQuery {
  const platform = params.get("platform") ?? "all";
  const status = params.get("status") ?? "all";
  const contentType = params.get("contentType") ?? "all";
  const segment = params.get("segment") ?? "all";

  return {
    platform: VALID_PLATFORMS.includes(platform as PublishingActivityPlatform | "all")
      ? (platform as PublishingActivityPlatform | "all")
      : "all",
    status: VALID_STATUSES.includes(status as PublishingActivityStatus | "all")
      ? (status as PublishingActivityStatus | "all")
      : "all",
    contentType: VALID_CONTENT_TYPES.includes(contentType as PublishingActivityContentType | "all")
      ? (contentType as PublishingActivityContentType | "all")
      : "all",
    segment: VALID_SEGMENTS.includes(segment as PublishingActivitySegment)
      ? (segment as PublishingActivitySegment)
      : "all",
    from: parseDate(params.get("from")),
    to: parseDate(params.get("to")),
    limit: parseLimit(params.get("limit")),
  };
}

export function getDefaultPublishingActivityQuery(): PublishingActivityQuery {
  return {
    platform: "all",
    status: "all",
    contentType: "all",
    segment: "all",
    from: undefined,
    to: undefined,
    limit: DEFAULT_LIMIT,
  };
}
