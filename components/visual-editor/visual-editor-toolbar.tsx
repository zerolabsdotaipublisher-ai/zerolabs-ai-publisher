"use client";

import type { EditorDocument, EditorPageId } from "@/lib/editor/document";
import type { VisualEditorViewport } from "@/lib/editor/visual";

interface VisualEditorToolbarProps {
  document: EditorDocument;
  selectedPageId: EditorPageId;
  viewport: VisualEditorViewport;
  dirty: boolean;
  previewMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onPageChange: (pageId: EditorPageId) => void;
  onSiteSelect: () => void;
  onViewportChange: (viewport: VisualEditorViewport) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewToggle: () => void;
}

const VIEWPORT_LABELS: Record<VisualEditorViewport, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export function VisualEditorToolbar({
  document,
  selectedPageId,
  viewport,
  dirty,
  previewMode,
  canUndo,
  canRedo,
  onPageChange,
  onSiteSelect,
  onViewportChange,
  onUndo,
  onRedo,
  onPreviewToggle,
}: VisualEditorToolbarProps) {
  return (
    <header className="visual-editor-toolbar">
      <div className="visual-editor-toolbar-site">
        <button type="button" className="visual-editor-site-button" aria-label="Select site settings" onClick={onSiteSelect}>
          {document.site.name || "Untitled site"}
        </button>
        <span className="visual-editor-draft-status" data-dirty={dirty ? "true" : "false"}>
          {dirty ? "Unsaved local draft" : "Draft-only mode"}
        </span>
      </div>
      <label className="visual-editor-toolbar-page">
        <span className="sr-only">Current page</span>
        <select value={selectedPageId} onChange={(event) => onPageChange(event.target.value)}>
          {document.pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
        </select>
      </label>
      <div className="visual-editor-toolbar-controls" aria-label="Editor controls">
        <div className="visual-editor-viewport-controls" role="group" aria-label="Viewport">
          {(Object.keys(VIEWPORT_LABELS) as VisualEditorViewport[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={viewport === candidate ? "is-active" : undefined}
              aria-pressed={viewport === candidate}
              onClick={() => onViewportChange(candidate)}
            >
              {VIEWPORT_LABELS[candidate]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo latest change">Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo latest change">Redo</button>
        <button type="button" className={previewMode ? "is-active" : undefined} aria-pressed={previewMode} onClick={onPreviewToggle}>
          {previewMode ? "Exit preview" : "Preview"}
        </button>
        <button type="button" className="visual-editor-save-button" disabled title="Atomic draft persistence is not available yet">
          Save disabled
        </button>
      </div>
    </header>
  );
}
