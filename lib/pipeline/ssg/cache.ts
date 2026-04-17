import type {
  StaticCachePolicy,
  StaticCachePolicyId,
  StaticCacheStrategy,
} from "./types";

export const STATIC_CACHE_POLICIES: Record<StaticCachePolicyId, StaticCachePolicy> = {
  "static-page-html": {
    id: "static-page-html",
    target: "html",
    browserMaxAgeSeconds: 0,
    cdnMaxAgeSeconds: 300,
    staleWhileRevalidateSeconds: 60,
    immutable: false,
    notes: "HTML can be refreshed by redeploying the generated website artifact.",
  },
  "static-page-data": {
    id: "static-page-data",
    target: "json",
    browserMaxAgeSeconds: 0,
    cdnMaxAgeSeconds: 300,
    staleWhileRevalidateSeconds: 60,
    immutable: false,
    notes: "Page data is versioned by structure/build output and should follow page HTML freshness.",
  },
  "static-assets": {
    id: "static-assets",
    target: "asset",
    browserMaxAgeSeconds: 31_536_000,
    cdnMaxAgeSeconds: 31_536_000,
    staleWhileRevalidateSeconds: 0,
    immutable: true,
    notes: "Local generated assets should be content-addressed before long-lived CDN caching.",
  },
  "external-assets": {
    id: "external-assets",
    target: "external",
    browserMaxAgeSeconds: 0,
    cdnMaxAgeSeconds: 0,
    staleWhileRevalidateSeconds: 0,
    immutable: false,
    notes: "External assets are referenced but not cached or controlled by AI Publisher.",
  },
};

export const STATIC_CACHE_STRATEGY: StaticCacheStrategy = {
  providerSpecific: false,
  policies: Object.values(STATIC_CACHE_POLICIES),
  defaultPagePolicyId: "static-page-html",
  defaultDataPolicyId: "static-page-data",
  defaultAssetPolicyId: "static-assets",
};

export const STATIC_ISR_REVALIDATE = false;

export function getStaticCachePolicy(id: StaticCachePolicyId): StaticCachePolicy {
  return STATIC_CACHE_POLICIES[id];
}

