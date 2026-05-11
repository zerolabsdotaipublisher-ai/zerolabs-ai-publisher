"use client";

import { useEffect, useMemo, useState } from "react";
import type { FileUploadApiRecord, FileUploadAssociationInput, FileUploadSource } from "@/lib/file-upload/types";
import type { StorageResourceType } from "@/lib/storage-access/types";
import type { MediaUsageLink } from "@/lib/media/types";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { FileUploadInput } from "./file-upload-input";
import { FileUploadList, type FileUploadListItem } from "./file-upload-list";

interface FileUploadPanelResponse {
  ok: boolean;
  upload?: FileUploadApiRecord;
  media?: {
    id: string;
    originalFilename: string;
  };
  signed?: {
    url: string;
    expiresAt: string;
  };
  item?: {
    id: string;
    displayName: string;
  };
  preview?: {
    url: string;
    expiresAt?: string;
  };
  error?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: FileUploadListItem["status"];
  error?: string;
  uploadId?: string;
  deleted?: boolean;
  response?: FileUploadPanelResponse;
}

interface FileUploadPanelProps {
  endpoint?: string;
  source?: FileUploadSource;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
  tenantId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  usageContext?: MediaUsageLink["usageContext"];
  associations?: FileUploadAssociationInput[];
  metadata?: Record<string, unknown>;
  maxFileSizeBytes?: number;
  allowDelete?: boolean;
  permissionResourceType?: StorageResourceType;
  permissionWebsiteId?: string;
  buildFormData?: (formData: FormData, file: File, item: { uploadId?: string }) => void;
  onUploaded?: (payload: FileUploadPanelResponse) => void;
}

const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function createClientId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`;
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept?.trim()) return true;
  const patterns = accept.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (!patterns.length) return true;

  return patterns.some((pattern) => {
    if (pattern.endsWith("/*")) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    if (pattern.startsWith(".")) {
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    }
    return file.type === pattern;
  });
}

export function FileUploadPanel({
  endpoint = "/api/file-upload",
  source,
  accept = "image/*,video/*,.pdf,.doc,.docx,.txt",
  multiple = true,
  disabled = false,
  title = "Upload files",
  description = "Drag files into AI Publisher or choose them from your device.",
  tenantId,
  linkedContentId,
  linkedContentType,
  usageContext,
  associations,
  metadata,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
  allowDelete = false,
  permissionResourceType = "file_upload",
  permissionWebsiteId,
  buildFormData,
  onUploaded,
}: FileUploadPanelProps) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [uploadAllowed, setUploadAllowed] = useState(true);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const effectiveDisabled = disabled || permissionLoading || !uploadAllowed;
  const websiteId = permissionWebsiteId ?? (typeof metadata?.websiteId === "string" ? metadata.websiteId : undefined);

  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      setPermissionLoading(true);
      try {
        const response = await fetch("/api/storage-access/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resourceType: permissionResourceType,
            operation: "upload",
            tenantId,
            websiteId,
            linkedContentId,
            linkedContentType,
          }),
        });
        const body = await response.json() as { ok: boolean; allowed?: boolean; error?: string };
        if (!cancelled) {
          setUploadAllowed(Boolean(response.ok && body.ok && body.allowed));
          if (!response.ok || !body.ok || !body.allowed) {
            setError(body.error || "You do not have permission to upload files in this context.");
          }
        }
      } catch {
        if (!cancelled) {
          setUploadAllowed(false);
          setError("Unable to verify upload permissions right now.");
        }
      } finally {
        if (!cancelled) {
          setPermissionLoading(false);
        }
      }
    }

    void checkPermission();
    return () => {
      cancelled = true;
    };
  }, [linkedContentId, linkedContentType, permissionResourceType, tenantId, websiteId]);

  const listItems = useMemo<FileUploadListItem[]>(() => items.map((item) => ({
    id: item.id,
    fileName: item.file.name,
    fileSizeBytes: item.file.size,
    status: item.status,
    progress: item.progress,
    error: item.error,
    deleted: item.deleted,
    canRetry: item.status === "failed" && uploadAllowed,
    canDelete:
      allowDelete &&
      item.status === "uploaded" &&
      Boolean(item.uploadId) &&
      !item.deleted &&
      item.response?.upload?.permissions?.delete !== false,
  })), [allowDelete, items, uploadAllowed]);

  function updateItem(id: string, updater: (item: UploadQueueItem) => UploadQueueItem): void {
    setItems((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  }

  function createValidationItem(file: File, validationError?: string): UploadQueueItem {
    return {
      id: createClientId(file),
      file,
      progress: 0,
      status: validationError ? "failed" : "selected",
      error: validationError,
    };
  }

  function validateFile(file: File): string | undefined {
    if (file.size < 1) return "File size must be greater than 0 bytes.";
    if (file.size > maxFileSizeBytes) return `File exceeds max size of ${maxFileSizeBytes} bytes.`;
    if (!matchesAccept(file, accept)) return "File type is not supported for this upload flow.";
    return undefined;
  }

  function uploadItem(item: UploadQueueItem, retryUploadId?: string): void {
    if (!uploadAllowed) {
      setError("You do not have permission to upload files in this context.");
      return;
    }

    setError(undefined);
    setMessage(undefined);
    updateItem(item.id, (current) => ({ ...current, status: "validating", progress: 0, error: undefined }));

    const formData = new FormData();
    formData.set("file", item.file);
    if (source) formData.set("source", source);
    if (tenantId) formData.set("tenantId", tenantId);
    if (linkedContentId) formData.set("linkedContentId", linkedContentId);
    if (linkedContentType) formData.set("linkedContentType", linkedContentType);
    if (usageContext) formData.set("usageContext", usageContext);
    if (associations?.length) formData.set("associations", JSON.stringify(associations));
    if (metadata) formData.set("metadata", JSON.stringify(metadata));
    if (retryUploadId) formData.set("retryUploadId", retryUploadId);
    buildFormData?.(formData, item.file, { uploadId: retryUploadId });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onloadstart = () => {
      updateItem(item.id, (current) => ({ ...current, status: "uploading", progress: 0 }));
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        updateItem(item.id, (current) => ({ ...current, status: "uploading", progress: (event.loaded / event.total) * 100 }));
      }
    };

    xhr.onload = () => {
      let body: FileUploadPanelResponse | null = null;
      try {
        body = JSON.parse(xhr.responseText) as FileUploadPanelResponse;
      } catch {
        body = null;
      }

      if (!body || xhr.status < 200 || xhr.status >= 300 || !body.ok || !body.upload) {
        const nextError = body?.error || "Upload failed.";
        updateItem(item.id, (current) => ({
          ...current,
          status: "failed",
          progress: 0,
          error: nextError,
          uploadId: body?.upload?.id ?? current.uploadId,
          response: body ?? current.response,
        }));
        setError(nextError);
        return;
      }

      updateItem(item.id, (current) => ({
        ...current,
        status: "uploaded",
        progress: 100,
        error: undefined,
        uploadId: body.upload?.id,
        response: body,
      }));
      setMessage(`Uploaded ${body.item?.displayName ?? body.media?.originalFilename ?? item.file.name}`);
      onUploaded?.(body);
    };

    xhr.onerror = () => {
      const nextError = "Upload failed. Check connectivity and try again.";
      updateItem(item.id, (current) => ({ ...current, status: "failed", progress: 0, error: nextError }));
      setError(nextError);
    };

    xhr.send(formData);
  }

  function handleFilesSelected(fileList: FileList): void {
    if (!uploadAllowed) {
      setError("You do not have permission to upload files in this context.");
      return;
    }

    const nextItems = Array.from(fileList).map((file) => createValidationItem(file, validateFile(file)));
    setItems((current) => [...nextItems, ...current]);

    nextItems.filter((item) => item.status !== "failed").forEach((item) => uploadItem(item));
  }

  async function handleDelete(itemId: string): Promise<void> {
    const target = items.find((entry) => entry.id === itemId);
    if (!target?.uploadId) return;

    try {
      const response = await fetch(`/api/file-upload/${encodeURIComponent(target.uploadId)}/delete`, { method: "DELETE" });
      const body = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to delete uploaded file.");
        return;
      }
      updateItem(itemId, (current) => ({ ...current, deleted: true }));
      setMessage(`Deleted ${target.file.name}`);
    } catch {
      setError("Unable to delete uploaded file.");
    }
  }

  return (
    <section className="file-upload-panel media-upload-panel" aria-label={title}>
      <div className="file-upload-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <FileUploadInput disabled={effectiveDisabled} multiple={multiple} accept={accept} onFilesSelected={handleFilesSelected} />
      </div>
      <FileUploadDropzone disabled={effectiveDisabled} multiple={multiple} accept={accept} onFilesSelected={handleFilesSelected} />
      <FileUploadList
        items={listItems}
        onRetry={(itemId) => {
          const target = items.find((entry) => entry.id === itemId);
          if (target) {
            uploadItem(target, target.uploadId ?? target.response?.upload?.id);
          }
        }}
        onDelete={allowDelete ? (itemId) => {
          void handleDelete(itemId);
        } : undefined}
      />
      {error ? <p className="auth-error">{error}</p> : null}
      {message ? <p className="auth-success">{message}</p> : null}
    </section>
  );
}
