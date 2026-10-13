"use client";

import { useEffect, useRef } from "react";
import { EditorDocumentRenderer } from "@/components/generated-site/document-renderer";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import type { VisualEditorViewport } from "@/lib/editor/visual";

interface VisualEditorCanvasProps {
  document: EditorDocument;
  pageId: EditorPageId;
  selectedNodeId?: EditorNodeId;
  hoveredNodeId?: EditorNodeId;
  viewport: VisualEditorViewport;
  previewMode: boolean;
  onSelectNode: (nodeId: EditorNodeId) => void;
  onSelectPage: () => void;
  onHoverNode: (nodeId?: EditorNodeId) => void;
}

function nodeIdFromEventTarget(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  return target.closest<HTMLElement>("[data-editor-node-id]")?.dataset.editorNodeId;
}

function hasRenderableChildren(document: EditorDocument, pageId: string): boolean {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  return Boolean(page?.rootNodeIds.some((rootId) => Object.values(document.nodes[rootId]?.slots ?? {}).some((slot) => slot.childIds.length > 0)));
}

export function VisualEditorCanvas({
  document,
  pageId,
  selectedNodeId,
  hoveredNodeId,
  viewport,
  previewMode,
  onSelectNode,
  onSelectPage,
  onHoverNode,
}: VisualEditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasContent = hasRenderableChildren(document, pageId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.querySelectorAll<HTMLElement>("[data-editor-node-id]").forEach((element) => {
      const nodeId = element.dataset.editorNodeId;
      element.toggleAttribute("data-visual-editor-selected", !previewMode && Boolean(nodeId && nodeId === selectedNodeId));
      element.toggleAttribute("data-visual-editor-hovered", !previewMode && Boolean(nodeId && nodeId === hoveredNodeId && nodeId !== selectedNodeId));
    });
  }, [document, hoveredNodeId, previewMode, selectedNodeId]);

  return (
    <main className="visual-editor-canvas" aria-label="Website canvas">
      <div className="visual-editor-canvas-meta">
        <span>{previewMode ? "Preview mode" : "Edit mode"}</span>
        <span>{viewport[0].toUpperCase()}{viewport.slice(1)} viewport</span>
      </div>
      <div className="visual-editor-canvas-scroll">
        <div
          ref={canvasRef}
          className={`visual-editor-canvas-frame visual-editor-viewport-${viewport}${previewMode ? " is-preview" : ""}`}
          tabIndex={0}
          onClickCapture={(event) => {
            if (previewMode) return;
            event.preventDefault();
            const nodeId = nodeIdFromEventTarget(event.target);
            if (nodeId) onSelectNode(nodeId);
            else onSelectPage();
          }}
          onMouseMove={(event) => {
            if (!previewMode) onHoverNode(nodeIdFromEventTarget(event.target));
          }}
          onMouseLeave={() => onHoverNode(undefined)}
          onFocusCapture={(event) => {
            if (!previewMode) {
              const nodeId = nodeIdFromEventTarget(event.target);
              if (nodeId) onSelectNode(nodeId);
            }
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onSelectPage();
              return;
            }
            if (!previewMode && (event.key === "Enter" || event.key === " ")) {
              const nodeId = nodeIdFromEventTarget(event.target);
              if (nodeId) {
                event.preventDefault();
                onSelectNode(nodeId);
              }
            }
          }}
        >
          <EditorDocumentRenderer document={document} pageId={pageId} renderHiddenPage />
          {!hasContent ? <div className="visual-editor-canvas-empty">This page has no sections yet. Structural editing arrives in Slice 5.</div> : null}
        </div>
      </div>
    </main>
  );
}
