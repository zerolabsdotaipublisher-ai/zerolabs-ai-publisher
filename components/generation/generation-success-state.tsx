interface GenerationSuccessStateProps {
  structureId?: string;
}

export function GenerationSuccessState({ structureId }: GenerationSuccessStateProps) {
  return (
    <section className="wizard-step-panel wizard-success" aria-live="polite">
      <h2>Website generated successfully</h2>
      <p>Your generated website is ready for preview and further edits.</p>
      {structureId ? <p>Generated website ID: {structureId}</p> : null}
    </section>
  );
}
