interface ManualOverrideButtonProps {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function ManualOverrideButton({ disabled = false, loading = false, onClick }: ManualOverrideButtonProps) {
  return (
    <button type="button" className="wizard-button-secondary" onClick={onClick} disabled={disabled}>
      {loading ? "Running override…" : "Manual override"}
    </button>
  );
}
