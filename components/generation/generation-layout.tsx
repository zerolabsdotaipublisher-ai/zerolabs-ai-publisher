import type { ReactNode } from "react";

interface GenerationLayoutProps {
  title: string;
  description: string;
  builderPanel: ReactNode;
  previewPanel: ReactNode;
}

export function GenerationLayout({
  title,
  description,
  builderPanel,
  previewPanel,
}: GenerationLayoutProps) {
  return (
    <section className="generation-shell website-builder-shell" aria-label="Website builder workspace">
      <header className="wizard-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <div className="website-builder-grid">
        <div className="website-builder-panel">{builderPanel}</div>
        <aside className="website-builder-panel website-builder-preview-panel">{previewPanel}</aside>
      </div>
    </section>
  );
}
