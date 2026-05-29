import { useState } from "react";

interface WebsiteRenameDialogProps {
  open: boolean;
  initialTitle: string;
  initialDescription?: string;
  busy?: boolean;
  onCancel: () => void;
  onSave: (payload: { title: string; description?: string }) => void;
}

export function WebsiteRenameDialog({
  open,
  initialTitle,
  initialDescription,
  busy = false,
  onCancel,
  onSave,
}: WebsiteRenameDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");

  if (!open) {
    return null;
  }

  return (
    <div className="website-rename-dialog" role="dialog" aria-modal="true" aria-label="Rename website metadata">
      <p>Update website title and listing description.</p>
      <label>
        <span>Website title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
      </label>
      <label>
        <span>Description</span>
        <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} />
      </label>
      <div className="website-rename-dialog-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !title.trim()}
          onClick={() => onSave({ title: title.trim(), description: description.trim() || undefined })}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
