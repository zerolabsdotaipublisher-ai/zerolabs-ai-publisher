import { useState } from "react";
import type { ManualOverrideScenario } from "@/lib/publish/override/types";

interface ManualOverrideDialogProps {
  open: boolean;
  loading?: boolean;
  canBypassApproval?: boolean;
  onCancel: () => void;
  onConfirm: (payload: {
    reason: string;
    scenario: ManualOverrideScenario;
    bypassApproval: boolean;
  }) => void;
}

const SCENARIO_OPTIONS: Array<{ value: ManualOverrideScenario; label: string }> = [
  { value: "urgent_publish", label: "Urgent publish" },
  { value: "hotfix_update", label: "Hotfix/update" },
  { value: "bypass_scheduled_time", label: "Bypass scheduled time" },
  { value: "bypass_approval", label: "Bypass approval" },
];

export function ManualOverrideDialog({
  open,
  loading = false,
  canBypassApproval = false,
  onCancel,
  onConfirm,
}: ManualOverrideDialogProps) {
  const [reason, setReason] = useState("");
  const [scenario, setScenario] = useState<ManualOverrideScenario>("urgent_publish");
  const [bypassApproval, setBypassApproval] = useState(false);

  if (!open) {
    return null;
  }

  const reasonValid = reason.trim().length >= 8;

  return (
    <section className="publish-confirmation" role="dialog" aria-modal="true" aria-live="polite">
      <h3>Manual publishing override</h3>
      <p>
        This action bypasses normal timing safeguards and can immediately publish live changes. Use only for urgent,
        audited interventions.
      </p>

      <label>
        <span>Override scenario</span>
        <select value={scenario} onChange={(event) => setScenario(event.target.value as ManualOverrideScenario)}>
          {SCENARIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Override reason (required)</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain why manual override is required"
        />
      </label>

      <label className="content-schedule-weekday">
        <input
          type="checkbox"
          checked={bypassApproval}
          onChange={(event) => setBypassApproval(event.target.checked)}
          disabled={!canBypassApproval}
        />
        <span>Bypass approval workflow (authorized approver/admin only)</span>
      </label>

      {!canBypassApproval ? (
        <p className="publish-warning">Your role can override publish timing but cannot bypass approval gates.</p>
      ) : null}

      <div className="publish-confirmation-actions">
        <button type="button" className="wizard-button-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm({ reason: reason.trim(), scenario, bypassApproval })}
          disabled={loading || !reasonValid}
        >
          {loading ? "Running…" : "Confirm manual override"}
        </button>
      </div>
    </section>
  );
}
