import type { FileUploadStatus } from "@/lib/file-upload/types";

interface FileUploadStatusBadgeProps {
  status: FileUploadStatus | "deleted";
}

function formatStatus(status: FileUploadStatus | "deleted"): string {
  return status.replaceAll("_", " ");
}

export function FileUploadStatusBadge({ status }: FileUploadStatusBadgeProps) {
  return <span className={`file-upload-status-badge is-${status}`}>{formatStatus(status)}</span>;
}
