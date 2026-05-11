import "server-only";

import { createMediaSignedUrlFromOwnerResource } from "@/lib/media/workflow";
import { StorageAccessError } from "@/lib/storage-access/errors";
import { getCachedWebsiteAssetDelivery, setCachedWebsiteAssetDelivery } from "./cache";
import { buildWebsiteAssetFallbackDelivery } from "./fallbacks";
import { createWebsiteAssetApiRecord } from "./model";
import { logWebsiteAssetEvent, logWebsiteAssetFailure, recordWebsiteAssetDuration } from "./monitoring";
import { authorizeWebsiteAssetAccess } from "./permissions";
import { getWebsiteAssetRecordById, listWebsiteAssetRecords } from "./storage";
import { appendWebsiteAssetQueryContext, buildWebsiteAssetRenderPath, withWebsiteAssetQueryContext } from "./urls";
import type { WebsiteAssetAccessLevel, WebsiteAssetApiRecord, WebsiteAssetDelivery, WebsiteAssetResolveQuery } from "./types";

function resolveAccessLevel(input: {
  publicationState?: string;
  userId?: string;
  previewToken?: string;
}): WebsiteAssetAccessLevel {
  if (input.previewToken) {
    return "preview";
  }
  if (input.publicationState === "published") {
    return input.userId ? "published" : "public";
  }
  return input.userId ? "draft" : "private";
}

function resolveCacheControl(accessLevel: WebsiteAssetAccessLevel): string {
  return accessLevel === "public" || accessLevel === "published"
    ? "public, max-age=300, s-maxage=300, stale-while-revalidate=60"
    : "private, no-store";
}

function createDeliveryCacheKey(input: {
  assetId: string;
  userId?: string;
  previewToken?: string;
  direct: boolean;
  surface: string;
}): string {
  return [
    input.assetId,
    input.userId ?? "anonymous",
    input.previewToken ? "preview-token" : "no-preview-token",
    input.direct ? "direct" : "render",
    input.surface,
  ].join(":");
}

function buildRenderUrl(assetId: string, previewToken?: string): string {
  return appendWebsiteAssetQueryContext(buildWebsiteAssetRenderPath(assetId), { previewToken });
}

export async function getWebsiteAssetDelivery(input: {
  assetId: string;
  userId?: string;
  previewToken?: string;
  direct?: boolean;
  surface: WebsiteAssetResolveQuery["surface"];
}): Promise<WebsiteAssetDelivery> {
  const startedAt = Date.now();

  try {
    const asset = await getWebsiteAssetRecordById(input.assetId);
    if (!asset) {
      throw new StorageAccessError("Website asset not found.", 404, "website_asset_not_found", { assetId: input.assetId });
    }

    const accessLevel = resolveAccessLevel({
      publicationState: asset.publicationState,
      userId: input.userId,
      previewToken: input.previewToken,
    });
    const renderUrl = buildRenderUrl(asset.id, input.previewToken);

    if (!asset.media) {
      logWebsiteAssetEvent("fallback", { assetId: asset.id, reason: "missing_media", surface: input.surface });
      return buildWebsiteAssetFallbackDelivery({ assetId: asset.id, accessLevel, renderUrl });
    }

    const authorization = await authorizeWebsiteAssetAccess({
      asset,
      userId: input.userId,
      previewToken: input.previewToken,
      operation: input.direct ? "signed_url" : "read",
    });

    const cacheKey = createDeliveryCacheKey({
      assetId: asset.id,
      userId: input.userId,
      previewToken: input.previewToken,
      direct: Boolean(input.direct),
      surface: input.surface,
    });
    const cached = getCachedWebsiteAssetDelivery(cacheKey);
    if (cached) {
      return cached;
    }

    if (!input.direct) {
      return {
        assetId: asset.id,
        renderUrl,
        safeAccessUrl: renderUrl,
        directAccessUrl: undefined,
        expiresAt: undefined,
        cacheControl: resolveCacheControl(accessLevel),
        accessLevel,
        isFallback: false,
        fallbackUrl: buildWebsiteAssetFallbackDelivery({ assetId: asset.id, accessLevel, renderUrl }).fallbackUrl,
      };
    }

    const signed = await createMediaSignedUrlFromOwnerResource({
      actor: authorization.actor,
      media: asset.media,
      cacheKeyPrefix: `website-assets:${input.surface}:${asset.id}`,
    });

    const delivery: WebsiteAssetDelivery = {
      assetId: asset.id,
      renderUrl,
      safeAccessUrl: signed.url,
      directAccessUrl: signed.url,
      expiresAt: signed.expiresAt,
      cacheControl: resolveCacheControl(accessLevel),
      accessLevel,
      isFallback: false,
      fallbackUrl: buildWebsiteAssetFallbackDelivery({ assetId: asset.id, accessLevel, renderUrl }).fallbackUrl,
    };
    setCachedWebsiteAssetDelivery(cacheKey, delivery);
    return delivery;
  } catch (error) {
    logWebsiteAssetFailure(input.direct ? "url" : "render", error, {
      assetId: input.assetId,
      userId: input.userId,
      surface: input.surface,
    });
    throw error;
  } finally {
    recordWebsiteAssetDuration(input.direct ? "url" : "render", Date.now() - startedAt);
  }
}

export async function resolveWebsiteAsset(input: WebsiteAssetResolveQuery & { userId?: string; tenantId?: string; }): Promise<WebsiteAssetApiRecord | null> {
  const startedAt = Date.now();
  try {
    if (input.assetId || input.libraryItemId) {
      const record = await getWebsiteAssetRecordById(input.assetId ?? input.libraryItemId ?? "");
      if (!record) return null;
      const delivery = await getWebsiteAssetDelivery({
        assetId: record.id,
        userId: input.userId,
        previewToken: input.previewToken,
        surface: input.surface,
      });
      logWebsiteAssetEvent("resolve", { assetId: record.id, surface: input.surface, userId: input.userId });
      return createWebsiteAssetApiRecord(record, delivery);
    }

    if (!input.userId || !input.tenantId) {
      throw new StorageAccessError("Authenticated user and tenant scope are required for this asset lookup.", 401, "website_asset_auth_required");
    }

    const page = await listWebsiteAssetRecords({ ...input, userId: input.userId, tenantId: input.tenantId, perPage: 1 });
    const record = page.items[0];
    if (!record) return null;

    const delivery = await getWebsiteAssetDelivery({
      assetId: record.id,
      userId: input.userId,
      previewToken: input.previewToken,
      surface: input.surface,
    });
    logWebsiteAssetEvent("resolve", { assetId: record.id, surface: input.surface, userId: input.userId });
    return createWebsiteAssetApiRecord(record, delivery);
  } finally {
    recordWebsiteAssetDuration("resolve", Date.now() - startedAt);
  }
}

export async function listWebsiteAssets(input: WebsiteAssetResolveQuery & { userId: string; tenantId: string; }): Promise<{
  items: WebsiteAssetApiRecord[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}> {
  const startedAt = Date.now();
  try {
    const page = await listWebsiteAssetRecords(input);
    const items = await Promise.all(page.items.map(async (record) => {
      const delivery = await getWebsiteAssetDelivery({
        assetId: record.id,
        userId: input.userId,
        previewToken: input.previewToken,
        surface: input.surface,
      });
      return createWebsiteAssetApiRecord(record, delivery);
    }));

    logWebsiteAssetEvent("list", {
      userId: input.userId,
      tenantId: input.tenantId,
      page: input.page,
      perPage: input.perPage,
      count: items.length,
      websiteId: input.websiteId,
    });

    return {
      items,
      total: page.total,
      page: page.page,
      perPage: page.perPage,
      hasMore: page.hasMore,
    };
  } catch (error) {
    logWebsiteAssetFailure("list", error, {
      userId: input.userId,
      tenantId: input.tenantId,
      page: input.page,
      perPage: input.perPage,
    });
    throw error;
  } finally {
    recordWebsiteAssetDuration("list", Date.now() - startedAt);
  }
}

export { withWebsiteAssetQueryContext };
