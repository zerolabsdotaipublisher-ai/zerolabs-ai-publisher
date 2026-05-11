"use client";

import { useRef } from "react";

interface FileUploadInputProps {
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  label?: string;
  onFilesSelected: (files: FileList) => void;
}

export function FileUploadInput({ disabled, multiple, accept, label = "Choose files", onFilesSelected }: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" className="wizard-button-secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
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
    </>
  );
}
