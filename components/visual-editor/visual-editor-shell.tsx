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
  const saveState = getVisualEditorSaveState();
  const compatibilityNotice = getVisualEditorCompatibilityNotice(state.document, projectabilityIssues);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (hasCommandModifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
        return;
      }
      if (hasCommandModifier && event.key.toLowerCase() === "y") {
        event.preventDefault();
        dispatch({ type: "redo" });
        return;
      }
      if (event.key === "Escape") {
        dispatch({ type: "clear-node-selection" });
        return;
      }
      if (state.previewMode || !state.selectedNodeId) return;
      if (hasCommandModifier && event.key.toLowerCase() === "d") {
        event.preventDefault();
        dispatch({ type: "duplicate-node", nodeId: state.selectedNodeId });
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (window.confirm("Delete this element and its nested contents from the local draft? You can undo this change.")) {
          dispatch({ type: "remove-node", nodeId: state.selectedNodeId });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.previewMode, state.selectedNodeId]);

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
        <strong>Draft-only mode.</strong> {saveState.message.replace("Draft-only mode. ", "")}
        {compatibilityNotice.message ? <span className="visual-editor-projectability-note">{compatibilityNotice.message}</span> : null}
      </div>
      <div className="visual-editor-workspace">
        <VisualEditorLayers
          document={state.document}
          selectedPageId={state.selectedPageId}
          selectedNodeId={state.selectedNodeId}
          selectedScope={state.selectedScope}
          expandedNodeIds={state.expandedNodeIds}
          onSelectPage={(pageId) => dispatch({ type: "select-page", pageId })}
          onSelectSite={() => dispatch({ type: "select-site" })}
          onAddPage={() => dispatch({ type: "add-page" })}
          onDuplicatePage={(pageId) => dispatch({ type: "duplicate-page", pageId })}
          onMovePage={(pageId, direction) => dispatch({ type: "move-page", pageId, direction })}
          onRemovePage={(pageId) => dispatch({ type: "remove-page", pageId })}
          onSelectNode={(nodeId, pageId) => dispatch({ type: "select-node", nodeId, pageId })}
          onToggleExpanded={(nodeId) => dispatch({ type: "toggle-node-expanded", nodeId })}
          onInsertNode={(target, nodeType) => dispatch({ type: "insert-node", target, nodeType })}
          onDuplicateNode={(nodeId) => dispatch({ type: "duplicate-node", nodeId })}
          onMoveNode={(nodeId, direction) => dispatch({ type: "move-node", nodeId, direction })}
          onNestNode={(nodeId) => dispatch({ type: "nest-node", nodeId })}
          onUnnestNode={(nodeId) => dispatch({ type: "unnest-node", nodeId })}
          onRemoveNode={(nodeId) => dispatch({ type: "remove-node", nodeId })}
          onCreateSymbol={(nodeId, name) => dispatch({ type: "create-symbol", nodeId, name })}
          onInsertSymbol={(target, symbolId) => dispatch({ type: "insert-symbol", target, symbolId })}
          onRenameSymbol={(symbolId, name) => dispatch({ type: "rename-symbol", symbolId, name })}
          onRemoveSymbol={(symbolId) => dispatch({ type: "remove-symbol", symbolId })}
          onUnlinkSymbolInstance={(nodeId) => dispatch({ type: "unlink-symbol-instance", nodeId })}
          navigationPanel={
            <VisualEditorNavigation
              document={state.document}
              onUpdate={(menuId, itemId, patch) => dispatch({ type: "update-navigation-item", menuId, itemId, patch })}
              onAdd={(menuId, parentItemId) => dispatch({ type: "add-navigation-item", menuId, parentItemId })}
              onRemove={(menuId, itemId) => dispatch({ type: "remove-navigation-item", menuId, itemId })}
              onMove={(menuId, itemId, direction) => dispatch({ type: "move-navigation-item", menuId, itemId, direction })}
            />
          }
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
          onInsertNode={(target, nodeType) => dispatch({ type: "insert-node", target, nodeType })}
          onDuplicateNode={(nodeId) => dispatch({ type: "duplicate-node", nodeId })}
          onMoveNode={(nodeId, direction) => dispatch({ type: "move-node", nodeId, direction })}
          onNestNode={(nodeId) => dispatch({ type: "nest-node", nodeId })}
          onUnnestNode={(nodeId) => dispatch({ type: "unnest-node", nodeId })}
          onRemoveNode={(nodeId) => dispatch({ type: "remove-node", nodeId })}
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
