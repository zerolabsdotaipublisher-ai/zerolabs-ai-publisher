"use client";

import { useEffect, useReducer } from "react";
import type { EditorDocument } from "@/lib/editor/document";
import {
  createVisualEditorState,
  findVisualEditorNodePageId,
  getVisualEditorCompatibilityNotice,
  getVisualEditorSaveState,
  visualEditorReducer,
} from "@/lib/editor/visual";
import type { EditorProjectionIssue } from "@/lib/editor/document";
import { VisualEditorCanvas } from "./visual-editor-canvas";
import { VisualEditorLayers } from "./visual-editor-layers";
import { VisualEditorNavigation } from "./visual-editor-navigation";
import { VisualEditorProperties } from "./visual-editor-properties";
import { VisualEditorToolbar } from "./visual-editor-toolbar";

interface VisualEditorShellProps {
  initialDocument: EditorDocument;
  initialPageId?: string;
  projectabilityIssues: EditorProjectionIssue[];
}

export function VisualEditorShell({ initialDocument, initialPageId, projectabilityIssues }: VisualEditorShellProps) {
  const [state, dispatch] = useReducer(
    visualEditorReducer,
    { document: initialDocument, pageId: initialPageId },
    ({ document, pageId }) => createVisualEditorState(document, pageId),
  );
  const saveState = getVisualEditorSaveState(state);
  const compatibilityNotice = getVisualEditorCompatibilityNotice(state.document, projectabilityIssues);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      dispatch({ type: "clear-node-selection" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="visual-editor-shell">
      <VisualEditorToolbar
        document={state.document}
        selectedPageId={state.selectedPageId}
        viewport={state.activeViewport}
        dirty={state.dirty}
        previewMode={state.previewMode}
        canUndo={state.undoStack.length > 0}
        canRedo={state.redoStack.length > 0}
        onSiteSelect={() => dispatch({ type: "select-site" })}
        onPageChange={(pageId) => dispatch({ type: "select-page", pageId })}
        onViewportChange={(viewport) => dispatch({ type: "set-viewport", viewport })}
        onUndo={() => dispatch({ type: "undo" })}
        onRedo={() => dispatch({ type: "redo" })}
        onPreviewToggle={() => dispatch({ type: "toggle-preview" })}
      />
      <div className="visual-editor-safety-banner" role="status">
        <strong>Draft-only visual editor.</strong> {saveState.message}
        {compatibilityNotice.message ? <span className="visual-editor-projectability-note">{compatibilityNotice.message}</span> : null}
      </div>
      <div className="visual-editor-workspace">
        <VisualEditorLayers
          document={state.document}
          selectedPageId={state.selectedPageId}
          selectedNodeId={state.selectedNodeId}
          expandedNodeIds={state.expandedNodeIds}
          onSelectPage={(pageId) => dispatch({ type: "select-page", pageId })}
          onSelectNode={(nodeId, pageId) => dispatch({ type: "select-node", nodeId, pageId })}
          onToggleExpanded={(nodeId) => dispatch({ type: "toggle-node-expanded", nodeId })}
          navigationPanel={<VisualEditorNavigation document={state.document} onUpdate={(menuId, itemId, patch) => dispatch({ type: "update-navigation-item", menuId, itemId, patch })} />}
        />
        <VisualEditorCanvas
          document={state.document}
          pageId={state.selectedPageId}
          selectedNodeId={state.selectedNodeId}
          hoveredNodeId={state.hoveredNodeId}
          viewport={state.activeViewport}
          previewMode={state.previewMode}
          onSelectNode={(nodeId) => dispatch({ type: "select-node", nodeId, pageId: findVisualEditorNodePageId(state.document, nodeId) })}
          onSelectPage={() => dispatch({ type: "clear-node-selection" })}
          onHoverNode={(nodeId) => dispatch({ type: "hover-node", nodeId })}
        />
        <VisualEditorProperties
          document={state.document}
          selectedScope={state.selectedScope}
          selectedPageId={state.selectedPageId}
          selectedNodeId={state.selectedNodeId}
          panelTab={state.panelTab}
          onPanelTabChange={(tab) => dispatch({ type: "set-panel-tab", tab })}
          onNodePropChange={(nodeId, path, value) => dispatch({ type: "update-node-prop", nodeId, path, value })}
          onNodeStyleChange={(nodeId, key, value) => dispatch({ type: "update-node-style", nodeId, key, value })}
          onNodeVisibilityChange={(nodeId, breakpoint, value) => dispatch({ type: "update-node-visibility", nodeId, breakpoint, value })}
          onPageChange={(pageId, path, value) => dispatch({ type: "update-page", pageId, path, value })}
          onSiteChange={(path, value) => dispatch({ type: "update-site", path, value })}
        />
      </div>
    </div>
  );
}
