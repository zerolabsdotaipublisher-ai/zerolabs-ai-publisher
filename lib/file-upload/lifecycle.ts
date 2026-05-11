import type { FileUploadLifecycleEvent, FileUploadRecord, FileUploadStatus } from "./types";

export function createFileUploadLifecycleEvent(
  status: FileUploadStatus,
  note?: string,
  metadata?: Record<string, unknown>,
): FileUploadLifecycleEvent {
  return {
    status,
    at: new Date().toISOString(),
    note,
    metadata,
  };
}

export function appendFileUploadLifecycle(
  lifecycle: FileUploadLifecycleEvent[],
  status: FileUploadStatus,
  note?: string,
  metadata?: Record<string, unknown>,
): FileUploadLifecycleEvent[] {
  return [...lifecycle, createFileUploadLifecycleEvent(status, note, metadata)];
}

export function transitionFileUpload(
  record: FileUploadRecord,
  status: FileUploadStatus,
  options?: {
    note?: string;
    metadata?: Record<string, unknown>;
    lastErrorCode?: string;
    lastErrorMessage?: string;
    retryCount?: number;
    mediaId?: string;
    associationSummary?: Record<string, unknown>;
    completedAt?: string;
    canceledAt?: string;
    deletedAt?: string;
    linkedContentId?: string;
    linkedContentType?: string;
  },
): FileUploadRecord {
  return {
    ...record,
    status,
    mediaId: options?.mediaId ?? record.mediaId,
    linkedContentId: options?.linkedContentId ?? record.linkedContentId,
    linkedContentType: options?.linkedContentType ?? record.linkedContentType,
    retryCount: options?.retryCount ?? record.retryCount,
    lastErrorCode: options?.lastErrorCode,
    lastErrorMessage: options?.lastErrorMessage,
    associationSummary: options?.associationSummary ?? record.associationSummary,
    lifecycle: appendFileUploadLifecycle(record.lifecycle, status, options?.note, options?.metadata),
    completedAt: options?.completedAt ?? record.completedAt,
    canceledAt: options?.canceledAt ?? record.canceledAt,
    deletedAt: options?.deletedAt ?? record.deletedAt,
    updatedAt: new Date().toISOString(),
  };
}
