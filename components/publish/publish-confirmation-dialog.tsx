import type { PublishAction } from "@/lib/publish";

interface PublishConfirmationDialogProps {
  open: boolean;
  action: PublishAction;
  hasUnpublishedChanges: boolean;
  hasUnsavedChanges: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishConfirmationDialog({
  open,
  action,
  hasUnpublishedChanges,
  hasUnsavedChanges,
  onConfirm,
  onCancel,
}: PublishConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <section className="publish-confirmation" role="dialog" aria-modal="true" aria-live="polite">
      <h3>{action === "publish" ? "Publish website" : "Update live website"}</h3>
      <p>
        {action === "publish"
          ? "This will make your saved draft live and shareable via the live URL."
          : "This will replace the current live website with your latest saved draft."}
      </p>
      {hasUnpublishedChanges ? <p>Your latest saved changes are not live yet.</p> : null}
      {hasUnsavedChanges ? <p>You still have unsaved edits in the editor. Save first to include them.</p> : null}
      <div className="publish-confirmation-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm}>
          Confirm {action === "publish" ? "publish" : "update"}
        </button>
      </div>
    </section>
  );
}
