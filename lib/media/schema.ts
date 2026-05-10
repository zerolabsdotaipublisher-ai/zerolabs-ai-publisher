import { clampMediaPage, clampMediaPerPage } from "./model";
import type { MediaListQuery, MediaSignedUrlQuery, MediaType, MediaUsageLink } from "./types";

const MEDIA_TYPES: MediaType[] = ["image", "video", "document", "thumbnail", "asset", "generated_image", "file"];
const USAGE_CONTEXTS: MediaUsageLink["usageContext"][] = [
  "library",
  "editing",
  "review",
  "publishing",
  "social",
  "thumbnail",
  "asset",
];

function parseIntSafe(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseMediaType(value: string | null | undefined): MediaType | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return MEDIA_TYPES.includes(normalized as MediaType) ? (normalized as MediaType) : undefined;
}

export function parseUsageContext(value: string | null | undefined): MediaUsageLink["usageContext"] | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase() as MediaUsageLink["usageContext"];
  return USAGE_CONTEXTS.includes(normalized) ? normalized : undefined;
}

export function parseMediaListQuery(searchParams: URLSearchParams): MediaListQuery {
  return {
    page: clampMediaPage(parseIntSafe(searchParams.get("page"))),
    perPage: clampMediaPerPage(parseIntSafe(searchParams.get("perPage"))),
    mediaType: parseMediaType(searchParams.get("mediaType")),
    linkedContentId: searchParams.get("linkedContentId")?.trim() || undefined,
    linkedContentType: searchParams.get("linkedContentType")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || undefined,
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };
}

export function parseMediaSignedUrlQuery(searchParams: URLSearchParams): MediaSignedUrlQuery {
  const parsed = parseIntSafe(searchParams.get("expiresInSeconds"));
  if (!parsed) return {};
  return { expiresInSeconds: Math.max(60, Math.min(60 * 60, parsed)) };
}

export interface ParsedMediaUploadBody {
  tenantId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
}

export function parseMediaUploadBody(value: unknown): ParsedMediaUploadBody {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    tenantId: typeof record.tenantId === "string" ? record.tenantId.trim() : undefined,
    linkedContentId: typeof record.linkedContentId === "string" ? record.linkedContentId.trim() : undefined,
    linkedContentType: typeof record.linkedContentType === "string" ? record.linkedContentType.trim() : undefined,
    usageContext:
      typeof record.usageContext === "string"
        ? parseUsageContext(record.usageContext)
        : undefined,
  };
}
