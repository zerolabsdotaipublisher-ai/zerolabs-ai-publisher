import type { ReactNode } from "react";

interface GenerationLayoutProps {
  title: string;
  description: string;
  builderPanel: ReactNode;
  previewPanel: ReactNode;
  entryPoint?: "create" | "generate";
}

export function GenerationLayout({
  title,
  description,
  builderPanel,
  previewPanel,
  entryPoint = "create",
}: GenerationLayoutProps) {
  return (
    <section
      className="generation-shell website-builder-shell"
      aria-label="Website builder workspace"
      data-entry-point={entryPoint}
    >
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
