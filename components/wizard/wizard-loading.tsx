interface WizardLoadingProps {
  stageLabel: string;
}

export function WizardLoading({ stageLabel }: WizardLoadingProps) {
  return (
    <section className="wizard-step-panel wizard-loading" aria-live="polite" aria-busy="true">
      <h2>Generating your website</h2>
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
