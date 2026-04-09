import type { ReactNode } from "react";

interface GenerationLayoutProps {
  inputPanel: ReactNode;
  statusPanel: ReactNode;
  actions: ReactNode;
}

export function GenerationLayout({ inputPanel, statusPanel, actions }: GenerationLayoutProps) {
  return (
    <section className="generation-shell" aria-label="Website generation interface">
      <header className="wizard-header">
        <h1>Generate website</h1>
        <p>Review inputs, run AI generation, then continue to preview.</p>
      </header>
      <div className="generation-grid">
        <div>{inputPanel}</div>
        <div>{statusPanel}</div>
      </div>
      <div>{actions}</div>
    </section>
  );
}
