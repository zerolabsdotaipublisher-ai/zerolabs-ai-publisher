"use client";

interface EditorPreviewPanelProps {
  previewHref?: string;
  title: string;
}

export function EditorPreviewPanel({ previewHref, title }: EditorPreviewPanelProps) {
  return (
    <section className="content-editor-preview-panel" aria-label="Editor preview panel">
      <h3>Preview</h3>
      {previewHref ? (
        <iframe className="content-editor-preview-frame" src={previewHref} title={`${title} preview`} loading="lazy" />
      ) : (
        <p>Preview is not available for this content type. Use review preview for rendered output.</p>
      )}
    </section>
  );
}
