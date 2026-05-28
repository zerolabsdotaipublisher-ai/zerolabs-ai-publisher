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
          Define your pages first, customize each page, then provide brand inputs for the existing
          AI generation pipeline.
        </p>
      </header>
      {children}
    </section>
  );
}
