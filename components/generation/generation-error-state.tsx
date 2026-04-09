interface GenerationErrorStateProps {
  error?: string;
}

export function GenerationErrorState({ error }: GenerationErrorStateProps) {
  if (!error) {
    return null;
  }

  return (
    <section className="wizard-step-panel wizard-error" role="alert" aria-live="assertive">
      <h2>Generation failed</h2>
      <p>{error}</p>
      <p>You can retry now or edit your inputs before regenerating.</p>
    </section>
  );
}
