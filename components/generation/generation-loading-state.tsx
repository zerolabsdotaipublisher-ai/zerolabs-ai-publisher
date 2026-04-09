interface GenerationLoadingStateProps {
  stageLabel: string;
}

export function GenerationLoadingState({ stageLabel }: GenerationLoadingStateProps) {
  return (
    <section className="wizard-step-panel wizard-loading" aria-live="polite" aria-busy="true">
      <h2>Generation in progress</h2>
      <p>{stageLabel}</p>
      <ul>
        <li>Preparing structured prompt inputs</li>
        <li>Generating website structure and layout</li>
        <li>Generating content, navigation, and SEO</li>
        <li>Finalizing generated site output</li>
      </ul>
    </section>
  );
}
