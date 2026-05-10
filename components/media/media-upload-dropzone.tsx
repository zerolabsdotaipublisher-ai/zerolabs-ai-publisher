"use client";

import { useRef } from "react";

interface MediaUploadDropzoneProps {
  disabled?: boolean;
  accept?: string;
  onFilesSelected: (files: FileList) => void;
}

export function MediaUploadDropzone({ disabled, accept, onFilesSelected }: MediaUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="media-upload-dropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) fileInputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <p>Drag & drop support is future-ready. Click to choose files now.</p>
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.files) {
            onFilesSelected(event.target.files);
          }
          event.currentTarget.value = "";
        }}
      />
    </section>
  );
}
