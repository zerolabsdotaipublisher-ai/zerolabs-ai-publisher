import { logger, metrics } from "@/lib/observability";

export type FileUploadOperation = "upload" | "batch" | "get" | "signed_url" | "delete";

export function logFileUploadEvent(operation: FileUploadOperation, meta: Record<string, unknown>): void {
  metrics.increment("requestCount");
  logger.info(`file_upload.${operation}`, {
    category: "request",
    service: "ai-publisher",
    ...meta,
  });
}

export function logFileUploadFailure(operation: FileUploadOperation, error: unknown, meta: Record<string, unknown>): void {
  metrics.increment("errorCount");
  logger.error(`file_upload.${operation} failed`, {
    category: "error",
    service: "ai-publisher",
    ...meta,
    error: {
      name: "FileUploadOperationError",
      message: error instanceof Error ? error.message : String(error),
    },
  });
}

export function recordFileUploadDuration(operation: FileUploadOperation, ms: number): void {
  metrics.recordDuration(`fileUpload${operation[0].toUpperCase()}${operation.slice(1)}Ms`, ms);
}
