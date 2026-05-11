import type { WebsiteAssetResolveQuery, WebsiteAssetSurface } from "./types";

const WEBSITE_ASSET_SURFACES: WebsiteAssetSurface[] = ["live", "preview", "editor", "library", "social"];

function parseIntSafe(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, value);
}

function clampPerPage(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 20;
  return Math.min(100, Math.max(1, value));
}

function parseSurface(value: string | null | undefined): WebsiteAssetSurface {
  if (!value) return "library";
  const normalized = value.trim().toLowerCase() as WebsiteAssetSurface;
  return WEBSITE_ASSET_SURFACES.includes(normalized) ? normalized : "library";
}

export function parseWebsiteAssetResolveQuery(searchParams: URLSearchParams): WebsiteAssetResolveQuery {
  return {
    assetId: searchParams.get("assetId")?.trim() || undefined,
    libraryItemId: searchParams.get("libraryItemId")?.trim() || undefined,
    mediaId: searchParams.get("mediaId")?.trim() || undefined,
    aiAssetId: searchParams.get("aiAssetId")?.trim() || undefined,
    websiteId: searchParams.get("websiteId")?.trim() || undefined,
    contentId: searchParams.get("contentId")?.trim() || undefined,
    contentType: searchParams.get("contentType")?.trim() || undefined,
    pageId: searchParams.get("pageId")?.trim() || undefined,
    sectionId: searchParams.get("sectionId")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || undefined,
    tenantId: searchParams.get("tenantId")?.trim() || undefined,
    previewToken: searchParams.get("previewToken")?.trim() || undefined,
    surface: parseSurface(searchParams.get("surface")),
    includeArchived: searchParams.get("includeArchived") === "true",
    includeDeleted: searchParams.get("includeDeleted") === "true",
    page: clampPage(parseIntSafe(searchParams.get("page"))),
    perPage: clampPerPage(parseIntSafe(searchParams.get("perPage"))),
  };
}

export function parseWebsiteAssetUrlRequest(searchParams: URLSearchParams): {
  previewToken?: string;
  surface: WebsiteAssetSurface;
  direct: boolean;
} {
  return {
    previewToken: searchParams.get("previewToken")?.trim() || undefined,
    surface: parseSurface(searchParams.get("surface")),
    direct: searchParams.get("direct") !== "false",
  };
}
