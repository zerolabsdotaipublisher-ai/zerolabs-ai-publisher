import Link from "next/link";

interface WizardSuccessProps {
  generatedSitePath?: string;
  onCreateAnother: () => void;
}

export function WizardSuccess({ generatedSitePath, onCreateAnother }: WizardSuccessProps) {
  return (
    <section className="wizard-step-panel wizard-success" aria-live="polite">
      <h2>Website generated successfully</h2>
      <p>Your new site is ready for review.</p>
      <div className="wizard-navigation-actions">
        {generatedSitePath ? <Link href={generatedSitePath}>Open generated website</Link> : null}
        <button type="button" className="wizard-button-secondary" onClick={onCreateAnother}>
          Create another website
        </button>
      </div>
    </section>
  );
}
