"use client";

import { FileUploadDropzone } from "@/components/file-upload/file-upload-dropzone";

interface MediaUploadDropzoneProps {
  disabled?: boolean;
  accept?: string;
  onFilesSelected: (files: FileList) => void;
}

export function MediaUploadDropzone({ disabled, accept, onFilesSelected }: MediaUploadDropzoneProps) {
  return <FileUploadDropzone disabled={disabled} accept={accept} multiple={false} onFilesSelected={onFilesSelected} />;
}
