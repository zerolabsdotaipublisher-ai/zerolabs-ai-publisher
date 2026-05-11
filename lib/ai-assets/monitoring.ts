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
  const normalizedOperation = operation
    .split("_")
    .map((segment, index) => (index === 0 ? segment : `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`))
    .join("");
  const operationLabel = `${normalizedOperation[0]?.toUpperCase() ?? ""}${normalizedOperation.slice(1)}`;
  metrics.recordDuration(`aiAsset${operationLabel}Ms`, ms);
}
