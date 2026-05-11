"use client";

interface MediaUploadProgressProps {
  progress: number;
  uploading: boolean;
  label?: string;
}

export function MediaUploadProgress({ progress, uploading, label }: MediaUploadProgressProps) {
  if (!uploading) return null;

  return (
    <div className="media-upload-progress" role="status" aria-live="polite">
      <p>{label ?? "Uploading media..."} {Math.round(progress)}%</p>
      <div className="media-upload-progress-track" aria-hidden="true">
        <div className="media-upload-progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}
