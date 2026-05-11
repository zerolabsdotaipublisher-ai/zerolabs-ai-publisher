import type { WebsiteAssetAccessLevel, WebsiteAssetDelivery } from "./types";

export const WEBSITE_ASSET_FALLBACK_URL = "/file.svg";

export function buildWebsiteAssetFallbackDelivery(input: {
  assetId: string;
  accessLevel: WebsiteAssetAccessLevel;
  renderUrl: string;
  safeAccessUrl?: string;
}): WebsiteAssetDelivery {
  return {
    assetId: input.assetId,
    renderUrl: input.renderUrl,
    safeAccessUrl: input.safeAccessUrl ?? WEBSITE_ASSET_FALLBACK_URL,
    directAccessUrl: undefined,
    expiresAt: undefined,
    cacheControl: input.accessLevel === "published"
      ? "public, max-age=300, s-maxage=300, stale-while-revalidate=60"
      : "private, no-store",
    accessLevel: input.accessLevel,
    isFallback: true,
    fallbackUrl: WEBSITE_ASSET_FALLBACK_URL,
  };
}
