import type { ReactNode } from "react";

interface WizardShellProps {
  children: ReactNode;
}

export function WizardShell({ children }: WizardShellProps) {
  return (
    <section className="wizard-shell" aria-label="Website creation wizard">
      <header className="wizard-header">
        <h1>Create website</h1>
        <p>
          Answer a few questions and AI Publisher will generate your website using the existing
          AI pipeline.
        </p>
      </header>
      {children}
    </section>
  );
}
