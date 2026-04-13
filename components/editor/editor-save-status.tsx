import type { EditorSaveStatus } from "@/lib/editor";

interface EditorSaveStatusProps {
  status: EditorSaveStatus;
  message?: string;
  dirty: boolean;
}

export function EditorSaveStatus({ status, message, dirty }: EditorSaveStatusProps) {
  const text = status === "saving"
    ? "Saving draft…"
    : status === "saved"
      ? message || "Draft saved"
      : status === "error"
        ? message || "Failed to save draft"
        : dirty
          ? "Unsaved changes"
          : "All changes saved";

  return (
    <p className={`editor-save-status editor-save-status-${status}`} aria-live="polite">
      {text}
    </p>
  );
}
