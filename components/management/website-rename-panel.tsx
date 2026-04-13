import { useState } from "react";

interface WebsiteRenamePanelProps {
  initialTitle: string;
  initialDescription?: string;
  busy?: boolean;
  onCancel: () => void;
  onSave: (payload: { title: string; description?: string }) => void;
}

export function WebsiteRenamePanel({
  initialTitle,
  initialDescription,
  busy = false,
  onCancel,
  onSave,
}: WebsiteRenamePanelProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");

  return (
    <div className="website-rename-panel">
      <label>
        <span>Website title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
      </label>
      <label>
        <span>Description</span>
        <input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} />
      </label>
      <div className="website-rename-panel-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !title.trim()}
          onClick={() => onSave({ title: title.trim(), description: description.trim() || undefined })}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
