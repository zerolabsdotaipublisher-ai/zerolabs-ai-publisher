"use client";

import { useEffect } from "react";

interface EditorUnsavedWarningProps {
  dirty: boolean;
}

export function EditorUnsavedWarning({ dirty }: EditorUnsavedWarningProps) {
  useEffect(() => {
    if (!dirty) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [dirty]);

  return dirty ? (
    <p className="editor-unsaved-warning" role="status" aria-live="polite">
      You have unsaved changes.
    </p>
  ) : null;
}
