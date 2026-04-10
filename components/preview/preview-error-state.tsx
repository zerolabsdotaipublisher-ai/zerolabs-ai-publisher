interface PreviewErrorStateProps {
  title?: string;
  description?: string;
}

export function PreviewErrorState({
  title = "Preview unavailable",
  description = "We couldn't render this preview right now. Try refreshing or returning to generation.",
}: PreviewErrorStateProps) {
  return (
    <section className="preview-state-panel wizard-error" role="alert" aria-live="assertive">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
