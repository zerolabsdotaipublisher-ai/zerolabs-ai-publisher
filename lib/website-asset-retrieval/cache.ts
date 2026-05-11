import type { WebsiteAssetDelivery, WebsiteAssetRecord } from "./types";

const RECORD_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 500;

const recordCache = new Map<string, { record: WebsiteAssetRecord; expiresAtMs: number }>();
const deliveryCache = new Map<string, { delivery: WebsiteAssetDelivery; expiresAtMs: number }>();

function prune<T>(cache: Map<string, { expiresAtMs: number } & T>, nowMs: number): void {
  const expiredKeys: string[] = [];
  for (const [key, value] of cache.entries()) {
    if (value.expiresAtMs <= nowMs) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach((key) => cache.delete(key));

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

export function getCachedWebsiteAssetRecord(assetId: string): WebsiteAssetRecord | undefined {
  const nowMs = Date.now();
  prune(recordCache, nowMs);
  const cached = recordCache.get(assetId);
  if (!cached || cached.expiresAtMs <= nowMs) {
    recordCache.delete(assetId);
    return undefined;
  }
  return cached.record;
}

export function setCachedWebsiteAssetRecord(assetId: string, record: WebsiteAssetRecord): void {
  const nowMs = Date.now();
  prune(recordCache, nowMs);
  recordCache.set(assetId, { record, expiresAtMs: nowMs + RECORD_TTL_MS });
}

export function getCachedWebsiteAssetDelivery(cacheKey: string): WebsiteAssetDelivery | undefined {
  const nowMs = Date.now();
  prune(deliveryCache, nowMs);
  const cached = deliveryCache.get(cacheKey);
  if (!cached || cached.expiresAtMs <= nowMs) {
    deliveryCache.delete(cacheKey);
    return undefined;
  }
  return cached.delivery;
}

export function setCachedWebsiteAssetDelivery(cacheKey: string, delivery: WebsiteAssetDelivery): void {
  if (!delivery.expiresAt) {
    return;
  }

  const parsedExpiresAt = new Date(delivery.expiresAt);
  const expiresAtMs = parsedExpiresAt.getTime();
  if (Number.isNaN(parsedExpiresAt.valueOf()) || !Number.isFinite(expiresAtMs)) {
    return;
  }

  const nowMs = Date.now();
  prune(deliveryCache, nowMs);
  deliveryCache.set(cacheKey, { delivery, expiresAtMs });
}
