"use client";

import { FileUploadProgress } from "@/components/file-upload/file-upload-progress";

interface MediaUploadProgressProps {
  progress: number;
  uploading: boolean;
  label?: string;
}

export function MediaUploadProgress({ progress, uploading, label }: MediaUploadProgressProps) {
  return <FileUploadProgress progress={progress} uploading={uploading} label={label} />;
}
