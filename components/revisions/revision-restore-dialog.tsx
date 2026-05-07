"use client";

interface RevisionRestoreDialogProps {
  revisionId?: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}

export function RevisionRestoreDialog({ revisionId, onCancel, onConfirm, pending }: RevisionRestoreDialogProps) {
  if (!revisionId) {
    return null;
  }

  return (
    <section className="review-action-bar" aria-label="Revision restore confirmation">
      <h3>Confirm restore</h3>
      <p>
        Restore revision <strong>{revisionId}</strong>? This will create a new rollback revision and return the content to review/approval flow.
      </p>
      <div className="review-action-controls">
        <button type="button" onClick={onConfirm} disabled={pending}>
          {pending ? "Restoring..." : "Confirm restore"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
      </div>
    </section>
  );
}
