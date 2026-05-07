"use client";

interface ContentEditingToolbarProps {
  saving: boolean;
  autoSaving: boolean;
  dirty: boolean;
  error?: string;
  message?: string;
  updatedAt: string;
  onSave: () => void;
}

export function ContentEditingToolbar({
  saving,
  autoSaving,
  dirty,
  error,
  message,
  updatedAt,
  onSave,
}: ContentEditingToolbarProps) {
  return (
    <section className="content-editing-toolbar" aria-label="Content editing toolbar">
      <div className="content-editing-toolbar-state" role="status" aria-live="polite">
        <strong>{saving ? "Saving…" : autoSaving ? "Autosaving…" : dirty ? "Unsaved changes" : "Saved"}</strong>
        <span>Last updated: {new Date(updatedAt).toLocaleString()}</span>
      </div>
      <div className="content-editing-toolbar-actions">
        <button type="button" onClick={onSave} disabled={saving || autoSaving || !dirty}>
          {saving ? "Saving…" : "Save draft"}
        </button>
      </div>
      {message ? <p className="content-editing-toolbar-message">{message}</p> : null}
      {error ? <p className="content-editing-toolbar-error">{error}</p> : null}
    </section>
  );
}
