import { logger, metrics } from "@/lib/observability";

export type WebsiteAssetOperation = "list" | "resolve" | "url" | "render" | "fallback";

export function logWebsiteAssetEvent(operation: WebsiteAssetOperation, meta: Record<string, unknown>): void {
  metrics.increment("requestCount");
  logger.info(`website-assets.${operation}`, {
    category: "request",
    service: "website-assets",
    ...meta,
  });
}

export function logWebsiteAssetFailure(operation: WebsiteAssetOperation, error: unknown, meta: Record<string, unknown>): void {
  metrics.increment("errorCount");
  logger.error(`website-assets.${operation} failed`, {
    category: "error",
    service: "website-assets",
    ...meta,
    error: {
      name: "WebsiteAssetRetrievalError",
      message: error instanceof Error ? error.message : String(error),
    },
  });
}

const WEBSITE_ASSET_DURATION_METRICS: Record<WebsiteAssetOperation, string> = {
  list: "websiteAssetListMs",
  resolve: "websiteAssetResolveMs",
  url: "websiteAssetUrlMs",
  render: "websiteAssetRenderMs",
  fallback: "websiteAssetFallbackMs",
};

export function recordWebsiteAssetDuration(operation: WebsiteAssetOperation, ms: number): void {
  metrics.recordDuration(WEBSITE_ASSET_DURATION_METRICS[operation], ms);
}
