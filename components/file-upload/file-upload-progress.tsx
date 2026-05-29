interface FileUploadProgressProps {
  progress: number;
  uploading: boolean;
  label?: string;
}

export function FileUploadProgress({ progress, uploading, label }: FileUploadProgressProps) {
  if (!uploading) return null;

  return (
    <div className="media-upload-progress file-upload-progress" role="status" aria-live="polite">
      <p>{label ?? "Uploading files..."} {Math.round(progress)}%</p>
      <div className="media-upload-progress-track" aria-hidden="true">
        <div className="media-upload-progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}
