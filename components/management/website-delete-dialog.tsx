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
  if (!open) {
    return null;
  }

  return (
    <div className="website-delete-dialog" role="alertdialog" aria-live="polite">
      <p>
        Delete <strong>{title}</strong>? This is a soft delete for MVP and removes the website from default
        management listings.
      </p>
      <div className="website-delete-dialog-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting…" : "Confirm delete"}
        </button>
      </div>
    </div>
  );
}
