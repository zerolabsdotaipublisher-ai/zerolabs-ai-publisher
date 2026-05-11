import { clampWebsiteMediaPage, clampWebsiteMediaPerPage } from "./model";
import type { WebsiteMediaLibraryListQuery, WebsiteMediaLibraryStatus, WebsiteMediaLibraryUsageKind } from "./types";

const USAGE_KINDS: WebsiteMediaLibraryUsageKind[] = [
  "library",
  "editor_insert",
  "website_content",
  "page_asset",
  "section_asset",
  "ai_asset_source",
];

function parseIntSafe(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseWebsiteMediaLibraryStatus(value: string | null | undefined): WebsiteMediaLibraryStatus | "all" | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["active", "archived", "deleted", "all"].includes(normalized)) {
    return normalized as WebsiteMediaLibraryStatus | "all";
  }
  return undefined;
}

export function parseWebsiteMediaUsageKind(value: string | null | undefined): WebsiteMediaLibraryUsageKind | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase() as WebsiteMediaLibraryUsageKind;
  return USAGE_KINDS.includes(normalized) ? normalized : undefined;
}

export function parseWebsiteMediaLibraryListQuery(searchParams: URLSearchParams): WebsiteMediaLibraryListQuery {
  return {
    page: clampWebsiteMediaPage(parseIntSafe(searchParams.get("page"))),
    perPage: clampWebsiteMediaPerPage(parseIntSafe(searchParams.get("perPage"))),
    search: searchParams.get("search")?.trim() || undefined,
    mediaType: searchParams.get("mediaType")?.trim() || undefined,
    websiteId: searchParams.get("websiteId")?.trim() || undefined,
    tag: searchParams.get("tag")?.trim() || undefined,
    linkedContentId: searchParams.get("linkedContentId")?.trim() || undefined,
    linkedContentType: searchParams.get("linkedContentType")?.trim() || undefined,
    status: parseWebsiteMediaLibraryStatus(searchParams.get("status")) ?? "active",
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function parseWebsiteMediaUploadBody(value: FormData | Record<string, unknown>) {
  const getter = (key: string): unknown => (value instanceof FormData ? value.get(key) : value[key]);
  const tagsSource = getter("tags");
  const tags = typeof tagsSource === "string"
    ? tagsSource.split(",").map((entry) => entry.trim()).filter(Boolean)
    : toStringArray(tagsSource);

  return {
    tenantId: typeof getter("tenantId") === "string" ? String(getter("tenantId")).trim() || undefined : undefined,
    websiteId: typeof getter("websiteId") === "string" ? String(getter("websiteId")).trim() || undefined : undefined,
    linkedContentId: typeof getter("linkedContentId") === "string" ? String(getter("linkedContentId")).trim() || undefined : undefined,
    linkedContentType: typeof getter("linkedContentType") === "string" ? String(getter("linkedContentType")).trim() || undefined : undefined,
    pageId: typeof getter("pageId") === "string" ? String(getter("pageId")).trim() || undefined : undefined,
    sectionId: typeof getter("sectionId") === "string" ? String(getter("sectionId")).trim() || undefined : undefined,
    title: typeof getter("title") === "string" ? String(getter("title")) : undefined,
    description: typeof getter("description") === "string" ? String(getter("description")) : undefined,
    altText: typeof getter("altText") === "string" ? String(getter("altText")) : undefined,
    tags,
  };
}

export function parseWebsiteMediaTagBody(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    websiteId: typeof record.websiteId === "string" ? record.websiteId.trim() || undefined : undefined,
    displayName: typeof record.displayName === "string" ? record.displayName : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
    altText: typeof record.altText === "string" ? record.altText : undefined,
    tags: Array.isArray(record.tags) ? record.tags.filter((entry): entry is string => typeof entry === "string") : undefined,
  };
}

export function parseWebsiteMediaUsageBody(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    websiteId: typeof record.websiteId === "string" ? record.websiteId.trim() || undefined : undefined,
    contentId: typeof record.contentId === "string" ? record.contentId.trim() || undefined : undefined,
    contentType: typeof record.contentType === "string" ? record.contentType.trim() || undefined : undefined,
    pageId: typeof record.pageId === "string" ? record.pageId.trim() || undefined : undefined,
    sectionId: typeof record.sectionId === "string" ? record.sectionId.trim() || undefined : undefined,
    usageKind: parseWebsiteMediaUsageKind(typeof record.usageKind === "string" ? record.usageKind : undefined),
    metadata: record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
      ? record.metadata as Record<string, unknown>
      : undefined,
  };
}
