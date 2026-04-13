interface PublishSuccessStateProps {
  message: string;
}

export function PublishSuccessState({ message }: PublishSuccessStateProps) {
  return (
    <p className="publish-success-state" role="status" aria-live="polite">
      {message}
    </p>
  );
}
