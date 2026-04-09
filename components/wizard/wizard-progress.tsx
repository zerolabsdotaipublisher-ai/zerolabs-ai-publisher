interface WizardProgressProps {
  current: number;
  total: number;
  label: string;
}

export function WizardProgress({ current, total, label }: WizardProgressProps) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.max(1, Math.min(current, safeTotal));
  const percentage = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="wizard-progress" aria-live="polite" aria-atomic="true">
      <div className="wizard-progress-meta">
        <span>
          Step {safeCurrent} of {safeTotal}
        </span>
        <span>{label}</span>
      </div>
      <div className="wizard-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <div className="wizard-progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
