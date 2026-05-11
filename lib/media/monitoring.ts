import { logger, metrics } from "@/lib/observability";
import type { MediaType } from "./types";

export type MediaOperation = "upload" | "list" | "signed_url" | "delete" | "get";

export function logMediaEvent(operation: MediaOperation, meta: Record<string, unknown>): void {
  metrics.increment("requestCount");
  logger.info(`media.${operation}`, {
    category: "request",
    service: "wasabi",
    ...meta,
  });
}

export function logMediaFailure(operation: MediaOperation, error: unknown, meta: Record<string, unknown>): void {
  metrics.increment("errorCount");
  logger.error(`media.${operation} failed`, {
    category: "error",
    service: "wasabi",
    ...meta,
    error: {
      name: "MediaOperationError",
      message: error instanceof Error ? error.message : String(error),
    },
  });
}

export function recordMediaDuration(operation: MediaOperation, ms: number): void {
  metrics.recordDuration(`media${operation[0].toUpperCase()}${operation.slice(1)}Ms`, ms);
}

export function recordMediaQuota(totalBytes: number, totalFiles: number, mediaType?: MediaType): void {
  logger.debug("media.quota.updated", {
    category: "request",
    service: "wasabi",
    totalBytes,
    totalFiles,
    mediaType,
  });
}
