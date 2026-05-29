import type { FileUploadStatus } from "@/lib/file-upload/types";
import { FileUploadProgress } from "./file-upload-progress";
import { FileUploadStatusBadge } from "./file-upload-status-badge";

export interface FileUploadListItem {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  status: FileUploadStatus;
  progress: number;
  error?: string;
  deleted?: boolean;
  canRetry?: boolean;
  canDelete?: boolean;
}

interface FileUploadListProps {
  items: FileUploadListItem[];
  onRetry?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadList({ items, onRetry, onDelete }: FileUploadListProps) {
  if (!items.length) return null;

  return (
    <div className="file-upload-list" role="list" aria-label="File upload list">
      {items.map((item) => (
        <article key={item.id} className="file-upload-list-item" role="listitem">
          <div className="file-upload-list-item-header">
            <div>
              <strong>{item.fileName}</strong>
              <p>{formatBytes(item.fileSizeBytes)}</p>
            </div>
            <FileUploadStatusBadge status={item.deleted ? "deleted" : item.status} />
          </div>
          <FileUploadProgress
            progress={item.progress}
            uploading={item.status === "uploading" || item.status === "validating"}
            label={item.status === "validating" ? "Validating file..." : undefined}
          />
          {item.error ? <p className="auth-error">{item.error}</p> : null}
          <div className="file-upload-list-item-actions">
            {item.canRetry && onRetry ? (
              <button type="button" className="wizard-button-secondary" onClick={() => onRetry(item.id)}>
                Retry
              </button>
            ) : null}
            {item.canDelete && onDelete ? (
              <button type="button" className="wizard-button-secondary" onClick={() => onDelete(item.id)}>
                Delete
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
