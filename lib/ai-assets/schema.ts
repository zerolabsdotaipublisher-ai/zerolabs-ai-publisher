import { clampAiAssetPage, clampAiAssetPerPage, parseAiAssetType } from "./model";
import { isAiAssetStatus } from "./lifecycle";
import type { AiAssetListQuery, AiAssetSignedUrlQuery, AiAssetStatus } from "./types";

function parseIntSafe(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseAiAssetStatus(value: string | null | undefined): AiAssetStatus | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return isAiAssetStatus(normalized) ? normalized : undefined;
}

export function parseAiAssetListQuery(searchParams: URLSearchParams): AiAssetListQuery {
  return {
    page: clampAiAssetPage(parseIntSafe(searchParams.get("page"))),
    perPage: clampAiAssetPerPage(parseIntSafe(searchParams.get("perPage"))),
    status: parseAiAssetStatus(searchParams.get("status")),
    assetType: parseAiAssetType(searchParams.get("assetType")),
    linkedContentId: searchParams.get("linkedContentId")?.trim() || undefined,
    linkedContentType: searchParams.get("linkedContentType")?.trim() || undefined,
    originalAssetId: searchParams.get("originalAssetId")?.trim() || undefined,
    search: searchParams.get("search")?.trim() || undefined,
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };
}

export function parseAiAssetSignedUrlQuery(searchParams: URLSearchParams): AiAssetSignedUrlQuery {
  const parsed = parseIntSafe(searchParams.get("expiresInSeconds"));
  if (!parsed) return {};
  return { expiresInSeconds: Math.max(60, Math.min(60 * 60, parsed)) };
}
