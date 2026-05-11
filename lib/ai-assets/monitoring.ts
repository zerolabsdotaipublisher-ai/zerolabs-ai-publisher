import { logger, metrics } from "@/lib/observability";

export type AiAssetOperation = "register" | "list" | "get" | "signed_url" | "delete" | "replace" | "variant";

export function logAiAssetEvent(operation: AiAssetOperation, meta: Record<string, unknown>): void {
  metrics.increment("requestCount");
  logger.info(`ai_assets.${operation}`, {
    category: "request",
    service: "wasabi",
    ...meta,
  });
}

export function logAiAssetFailure(operation: AiAssetOperation, error: unknown, meta: Record<string, unknown>): void {
  metrics.increment("errorCount");
  logger.error(`ai_assets.${operation} failed`, {
    category: "error",
    service: "wasabi",
    ...meta,
    error: {
      name: "AiAssetOperationError",
      message: error instanceof Error ? error.message : String(error),
    },
  });
}

export function recordAiAssetDuration(operation: AiAssetOperation, ms: number): void {
  metrics.recordDuration(`aiAsset${operation[0].toUpperCase()}${operation.slice(1)}Ms`, ms);
}
