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

export function recordWebsiteAssetDuration(operation: WebsiteAssetOperation, ms: number): void {
  metrics.recordDuration(`websiteAsset${operation[0].toUpperCase()}${operation.slice(1)}Ms`, ms);
}
