import { useEffect, useState } from "react";

interface WebsiteDeleteDialogProps {
  title: string;
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function WebsiteDeleteDialog({
  title,
  open,
  loading = false,
  onCancel,
  onConfirm,
}: WebsiteDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="website-delete-dialog" role="alertdialog" aria-live="polite">
      <p>
        Delete <strong>{title}</strong>? This is a soft delete for MVP and removes the website from default management
        listings.
      </p>
      <label className="website-delete-confirm-toggle">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={loading}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>I understand this changes website state and hides it from default listing.</span>
      </label>
      <div className="website-delete-dialog-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={loading || !confirmed}>
          {loading ? "Deleting…" : "Confirm delete"}
        </button>
      </div>
    </div>
  );
}
