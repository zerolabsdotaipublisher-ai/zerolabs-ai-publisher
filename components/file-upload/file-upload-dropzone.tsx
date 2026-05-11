"use client";

import { useRef } from "react";

interface FileUploadDropzoneProps {
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  label?: string;
  helperText?: string;
  onFilesSelected: (files: FileList) => void;
}

export function FileUploadDropzone({
  disabled,
  multiple,
  accept,
  label = "Drag files here or click to choose files.",
  helperText = "Signed URLs and owner-scoped access are applied after upload.",
  onFilesSelected,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="media-upload-dropzone file-upload-dropzone"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        if (event.dataTransfer.files?.length) {
          onFilesSelected(event.dataTransfer.files);
        }
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <p>{label}</p>
      <p className="file-upload-helper-text">{helperText}</p>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        accept={accept}
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
