interface PublishErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function PublishErrorState({ message, onRetry }: PublishErrorStateProps) {
  return (
    <div className="publish-error-state" role="alert" aria-live="assertive">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="wizard-button-secondary" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
