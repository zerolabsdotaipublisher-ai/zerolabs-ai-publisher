import type { ReactNode } from "react";

interface GenerationLayoutProps {
  title: string;
  description: string;
  navigatorPanel?: ReactNode;
  builderPanel: ReactNode;
  previewPanel: ReactNode;
  entryPoint?: "create" | "generate";
}

export function GenerationLayout({
  title,
  description,
  navigatorPanel,
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
        {navigatorPanel ? (
          <aside className="website-builder-panel website-builder-navigator-panel">
            {navigatorPanel}
          </aside>
        ) : null}
        <div className="website-builder-panel website-builder-panel-primary">{builderPanel}</div>
        <aside
          className="website-builder-panel website-builder-preview-panel"
          aria-label={entryPoint === "generate" ? "Inputs, review, and actions" : "Website preview"}
        >
          {previewPanel}
        </aside>
      </div>
    </section>
  );
}
