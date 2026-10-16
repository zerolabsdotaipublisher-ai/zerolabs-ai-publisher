"use client";

import { useEffect, useRef } from "react";
import { EditorDocumentRenderer } from "@/components/generated-site/document-renderer";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import type { VisualEditorInsertTarget, VisualEditorViewport } from "@/lib/editor/visual";
import { VisualEditorAddElementPicker, VisualEditorNodeActionBar } from "./visual-editor-structure-controls";

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
  onInsertNode: (target: VisualEditorInsertTarget, nodeType: string) => void;
  onDuplicateNode: (nodeId: EditorNodeId) => void;
  onMoveNode: (nodeId: EditorNodeId, direction: "up" | "down") => void;
  onNestNode: (nodeId: EditorNodeId) => void;
  onUnnestNode: (nodeId: EditorNodeId) => void;
  onRemoveNode: (nodeId: EditorNodeId) => void;
}

function nodeIdFromEventTarget(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  return target.closest<HTMLElement>("[data-editor-symbol-instance-id]")?.dataset.editorSymbolInstanceId
    ?? target.closest<HTMLElement>("[data-editor-node-id]")?.dataset.editorNodeId;
}

function isCanvasControlTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-visual-editor-control]"));
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
  onInsertNode,
  onDuplicateNode,
  onMoveNode,
  onNestNode,
  onUnnestNode,
  onRemoveNode,
}: VisualEditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const hasContent = hasRenderableChildren(document, pageId);
  const selectedNode = selectedNodeId ? document.nodes[selectedNodeId] : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.querySelectorAll<HTMLElement>("[data-editor-node-id], [data-editor-symbol-instance-id]").forEach((element) => {
      const nodeId = element.dataset.editorSymbolInstanceId ?? element.dataset.editorNodeId;
      element.toggleAttribute("data-visual-editor-selected", !previewMode && Boolean(nodeId && nodeId === selectedNodeId));
      element.toggleAttribute("data-visual-editor-hovered", !previewMode && Boolean(nodeId && nodeId === hoveredNodeId && nodeId !== selectedNodeId));
      if (nodeId && document.nodes[nodeId]) element.dataset.visualEditorLabel = document.nodes[nodeId].type;
      else delete element.dataset.visualEditorLabel;
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
            if (isCanvasControlTarget(event.target)) return;
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
            if (!previewMode && !isCanvasControlTarget(event.target)) {
              const nodeId = nodeIdFromEventTarget(event.target);
              if (nodeId) onSelectNode(nodeId);
            }
          }}
          onKeyDownCapture={(event) => {
            if (isCanvasControlTarget(event.target)) return;
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
          {!previewMode && selectedNode ? (
            <div className="visual-editor-canvas-context" data-visual-editor-control>
              <p>Selected canvas element</p>
              <VisualEditorNodeActionBar
                document={document}
                nodeId={selectedNode.id}
                onDuplicateNode={onDuplicateNode}
                onMoveNode={onMoveNode}
                onNestNode={onNestNode}
                onUnnestNode={onUnnestNode}
                onDeleteNode={onRemoveNode}
              />
              <VisualEditorAddElementPicker
                document={document}
                pageId={pageId}
                destinationNodeId={selectedNode.id}
                onInsertNode={onInsertNode}
                compact
              />
            </div>
          ) : null}
          <EditorDocumentRenderer document={document} pageId={pageId} renderHiddenPage />
          {!hasContent ? (
            <div className="visual-editor-canvas-empty" data-visual-editor-control>
              <p>This page has no sections yet.</p>
              <VisualEditorAddElementPicker document={document} pageId={pageId} onInsertNode={onInsertNode} />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
