interface WizardNavigationProps {
  canBack: boolean;
  canSkip: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
}

export function WizardNavigation({
  canBack,
  canSkip,
  isSubmitting,
  nextLabel = "Next",
  backLabel = "Back",
  onBack,
  onNext,
  onSkip,
}: WizardNavigationProps) {
  return (
    <div className="wizard-navigation">
      <button type="button" onClick={onBack} disabled={!canBack || isSubmitting}>
        {backLabel}
      </button>
      <div className="wizard-navigation-actions">
        {canSkip && onSkip ? (
          <button
            type="button"
            className="wizard-button-secondary"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Skip
          </button>
        ) : null}
        <button type="button" onClick={onNext} disabled={isSubmitting}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
