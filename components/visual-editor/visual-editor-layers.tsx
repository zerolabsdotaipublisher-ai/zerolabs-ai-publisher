"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import {
  findVisualEditorNodePageId,
  getVisualEditorDuplicateBlocker,
  getVisualEditorGlobalLayers,
  getVisualEditorInsertOptions,
  getVisualEditorMoveAvailability,
  getVisualEditorNestBlocker,
  getVisualEditorPageLayers,
  getVisualEditorPageInsertTargets,
  getVisualEditorPageRemovalBlocker,
  getVisualEditorRemovalBlocker,
  getVisualEditorUnnestBlocker,
  type VisualEditorInsertTarget,
  type VisualEditorLayerNode,
  type VisualEditorSelectionScope,
} from "@/lib/editor/visual";
import { VisualEditorOperationNote } from "./visual-editor-operation-note";
import { VisualEditorSymbols } from "./visual-editor-symbols";

type LeftPanelTab = "layers" | "design" | "globals" | "navigation" | "symbols";

interface VisualEditorLayersProps {
  document: EditorDocument;
  selectedPageId: EditorPageId;
  selectedNodeId?: EditorNodeId;
  selectedScope: VisualEditorSelectionScope;
  expandedNodeIds: string[];
  onSelectPage: (pageId: EditorPageId) => void;
  onSelectSite: () => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: EditorPageId) => void;
  onMovePage: (pageId: EditorPageId, direction: "up" | "down") => void;
  onRemovePage: (pageId: EditorPageId) => void;
  onSelectNode: (nodeId: EditorNodeId, pageId?: EditorPageId) => void;
  onToggleExpanded: (nodeId: EditorNodeId) => void;
  onInsertNode: (target: VisualEditorInsertTarget, nodeType: string) => void;
  onDuplicateNode: (nodeId: EditorNodeId) => void;
  onMoveNode: (nodeId: EditorNodeId, direction: "up" | "down") => void;
  onNestNode: (nodeId: EditorNodeId) => void;
  onUnnestNode: (nodeId: EditorNodeId) => void;
  onRemoveNode: (nodeId: EditorNodeId) => void;
  onCreateSymbol: (nodeId: EditorNodeId, name?: string) => void;
  onInsertSymbol: (target: VisualEditorInsertTarget, symbolId: string) => void;
  onRenameSymbol: (symbolId: string, name: string) => void;
  onRemoveSymbol: (symbolId: string) => void;
  onUnlinkSymbolInstance: (nodeId: EditorNodeId) => void;
  navigationPanel: ReactNode;
}

function targetKey(target: VisualEditorInsertTarget): string {
  return `${target.parentId}:${target.slotName}`;
}

function VisualEditorStructurePanel({
  document,
  pageId,
  nodeId,
  onInsertNode,
  onDuplicateNode,
  onMoveNode,
  onNestNode,
  onUnnestNode,
  onRemoveNode,
}: {
  document: EditorDocument;
  pageId: EditorPageId;
  nodeId?: EditorNodeId;
  onInsertNode: VisualEditorLayersProps["onInsertNode"];
  onDuplicateNode: VisualEditorLayersProps["onDuplicateNode"];
  onMoveNode: VisualEditorLayersProps["onMoveNode"];
  onNestNode: VisualEditorLayersProps["onNestNode"];
  onUnnestNode: VisualEditorLayersProps["onUnnestNode"];
  onRemoveNode: VisualEditorLayersProps["onRemoveNode"];
}) {
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>();
  const [selectedType, setSelectedType] = useState<string>();
  const selectedNode = nodeId ? document.nodes[nodeId] : undefined;
  const selectedNodeTargets = selectedNode
    ? Object.keys(selectedNode.slots).map((slotName) => ({ parentId: selectedNode.id, slotName, label: `Inside selected element · ${slotName}` }))
    : [];
  const pageTargets = getVisualEditorPageInsertTargets(document, pageId).map((target) => ({ ...target, label: `Page · ${target.label}` }));
  const targets = [...selectedNodeTargets, ...pageTargets].filter((target, index, candidates) =>
    candidates.findIndex((candidate) => targetKey(candidate) === targetKey(target)) === index && getVisualEditorInsertOptions(document, target).length > 0,
  );
  const activeTarget = targets.find((target) => targetKey(target) === selectedTargetKey) ?? targets[0];
  const insertOptions = activeTarget ? getVisualEditorInsertOptions(document, activeTarget) : [];
  const activeType = insertOptions.some((option) => option.type === selectedType) ? selectedType : insertOptions[0]?.type;
  const duplicateBlocker = selectedNode ? getVisualEditorDuplicateBlocker(document, selectedNode.id) : undefined;
  const removalBlocker = selectedNode ? getVisualEditorRemovalBlocker(document, selectedNode.id) : undefined;
  const moveAvailability = selectedNode ? getVisualEditorMoveAvailability(document, selectedNode.id) : { up: false, down: false };
  const nestBlocker = selectedNode ? getVisualEditorNestBlocker(document, selectedNode.id) : undefined;
  const unnestBlocker = selectedNode ? getVisualEditorUnnestBlocker(document, selectedNode.id) : undefined;
  const addBlocker = !activeTarget
    ? "Add element is unavailable: no registry-compatible destination is available here."
    : !activeType
      ? "Add element is unavailable: this destination has no supported element types."
      : undefined;
  const moveUpBlocker = moveAvailability.up ? undefined : "Move up is unavailable: there is no earlier editable sibling.";
  const moveDownBlocker = moveAvailability.down ? undefined : "Move down is unavailable: there is no later editable sibling.";

  return (
    <section className="visual-editor-structure-panel" aria-labelledby="visual-editor-structure-heading">
      <div>
        <h2 id="visual-editor-structure-heading">Structure</h2>
        <p className="visual-editor-muted-note">These changes affect only the local draft and can be undone.</p>
      </div>
      <div className="visual-editor-structure-add">
        <label>
          <span>Insert into</span>
          <select value={activeTarget ? targetKey(activeTarget) : ""} disabled={!targets.length} title={!targets.length ? addBlocker : undefined} onChange={(event) => setSelectedTargetKey(event.target.value)}>
            {targets.map((target) => <option key={targetKey(target)} value={targetKey(target)}>{target.label}</option>)}
          </select>
        </label>
        <label>
          <span>Element</span>
          <select value={activeType ?? ""} disabled={!insertOptions.length} title={!insertOptions.length ? addBlocker : undefined} onChange={(event) => setSelectedType(event.target.value)}>
            {insertOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => activeTarget && activeType && onInsertNode(activeTarget, activeType)} disabled={!activeTarget || !activeType} title={addBlocker}>Add element</button>
        <VisualEditorOperationNote messages={[addBlocker]} />
      </div>
      {selectedNode ? (
        <div className="visual-editor-structure-actions">
          <p>Selected: <strong>{selectedNode.type}</strong></p>
          <div>
            <button type="button" onClick={() => onMoveNode(selectedNode.id, "up")} disabled={!moveAvailability.up} title={moveUpBlocker}>Move up</button>
            <button type="button" onClick={() => onMoveNode(selectedNode.id, "down")} disabled={!moveAvailability.down} title={moveDownBlocker}>Move down</button>
            <button type="button" onClick={() => onNestNode(selectedNode.id)} disabled={Boolean(nestBlocker)} title={nestBlocker}>Nest</button>
            <button type="button" onClick={() => onUnnestNode(selectedNode.id)} disabled={Boolean(unnestBlocker)} title={unnestBlocker}>Unnest</button>
            <button type="button" onClick={() => onDuplicateNode(selectedNode.id)} disabled={Boolean(duplicateBlocker)} title={duplicateBlocker}>Duplicate</button>
            <button
              type="button"
              className="is-danger"
              onClick={() => {
                if (window.confirm("Delete this element and its nested contents from the local draft? You can undo this change.")) onRemoveNode(selectedNode.id);
              }}
              disabled={Boolean(removalBlocker)}
              title={removalBlocker}
            >
              Delete
            </button>
          </div>
          <VisualEditorOperationNote messages={[
            moveUpBlocker,
            moveDownBlocker,
            nestBlocker ? `Nest is unavailable: ${nestBlocker}` : undefined,
            unnestBlocker ? `Unnest is unavailable: ${unnestBlocker}` : undefined,
            duplicateBlocker ? `Duplicate is unavailable: ${duplicateBlocker}` : undefined,
            removalBlocker ? `Delete is unavailable: ${removalBlocker}` : undefined,
          ]} />
        </div>
      ) : null}
    </section>
  );
}

function LayerNode({
  node,
  selectedNodeId,
  expandedNodeIds,
  pageId,
  depth,
  onSelect,
  onToggle,
}: {
  node: VisualEditorLayerNode;
  selectedNodeId?: string;
  expandedNodeIds: string[];
  pageId: string;
  depth: number;
  onSelect: (nodeId: string, pageId: string) => void;
  onToggle: (nodeId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedNodeIds.includes(node.id);
  return (
    <li className="visual-editor-layer-item" data-depth={depth}>
      <div className="visual-editor-layer-row">
        {hasChildren ? (
          <button type="button" className="visual-editor-layer-expand" aria-label={`${expanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={expanded} onClick={() => onToggle(node.id)}>
            {expanded ? "▾" : "▸"}
          </button>
        ) : <span className="visual-editor-layer-expand-spacer" aria-hidden="true" />}
        <button
          type="button"
          className={`visual-editor-layer-select${selectedNodeId === node.id ? " is-selected" : ""}`}
          aria-current={selectedNodeId === node.id ? "true" : undefined}
          onClick={() => onSelect(node.id, pageId)}
          title={node.type}
        >
          <span>{node.label}</span>
          {node.hidden ? <small title="Hidden">Hidden</small> : null}
          {node.unsupported ? <small className="is-warning" title="This legacy node cannot be losslessly projected">Unsupported</small> : null}
        </button>
      </div>
      {hasChildren && expanded ? (
        <ul className="visual-editor-layer-children">
          {node.children.map((child) => <LayerNode key={child.id} node={child} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={pageId} depth={depth + 1} onSelect={onSelect} onToggle={onToggle} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function VisualEditorLayers({
  document,
  selectedPageId,
  selectedNodeId,
  selectedScope,
  expandedNodeIds,
  onSelectPage,
  onSelectSite,
  onAddPage,
  onDuplicatePage,
  onMovePage,
  onRemovePage,
  onSelectNode,
  onToggleExpanded,
  onInsertNode,
  onDuplicateNode,
  onMoveNode,
  onNestNode,
  onUnnestNode,
  onRemoveNode,
  onCreateSymbol,
  onInsertSymbol,
  onRenameSymbol,
  onRemoveSymbol,
  onUnlinkSymbolInstance,
  navigationPanel,
}: VisualEditorLayersProps) {
  const [tab, setTab] = useState<LeftPanelTab>("layers");
  const layers = getVisualEditorPageLayers(document, selectedPageId);
  const globalLayers = getVisualEditorGlobalLayers(document);
  const header = document.globals.header ? document.nodes[document.globals.header.nodeId] : undefined;
  const footer = document.globals.footer ? document.nodes[document.globals.footer.nodeId] : undefined;
  const selectedPageIndex = document.pages.findIndex((page) => page.id === selectedPageId);
  const selectedPageRemovalBlocker = getVisualEditorPageRemovalBlocker(document, selectedPageId);
  const pageMoveUpBlocker = selectedPageIndex <= 0 ? "Move up is unavailable: this page is already first." : undefined;
  const pageMoveDownBlocker = selectedPageIndex < 0 || selectedPageIndex === document.pages.length - 1
    ? "Move down is unavailable: this page is already last."
    : undefined;

  return (
    <aside className="visual-editor-left-panel" aria-label="Pages and layers">
      <div className="visual-editor-left-tabs" role="tablist" aria-label="Editor navigation">
        {(["layers", "design", "globals", "navigation", "symbols"] as LeftPanelTab[]).map((candidate) => (
          <button key={candidate} type="button" role="tab" aria-selected={tab === candidate} className={tab === candidate ? "is-active" : undefined} onClick={() => setTab(candidate)}>
            {candidate === "layers" ? "Pages" : candidate === "design" ? "Design" : candidate === "globals" ? "Globals" : candidate === "navigation" ? "Navigation" : "Symbols"}
          </button>
        ))}
      </div>
      {tab === "layers" ? (
        <div className="visual-editor-left-scroll">
          <section aria-labelledby="visual-editor-pages-heading">
            <div className="visual-editor-pages-heading">
              <h2 id="visual-editor-pages-heading">Pages</h2>
              <button type="button" onClick={onAddPage}>Add page</button>
            </div>
            <ul className="visual-editor-page-list">
              {document.pages.map((page) => (
                <li key={page.id}>
                  <button type="button" className={selectedPageId === page.id && !selectedNodeId ? "is-selected" : undefined} onClick={() => onSelectPage(page.id)}>
                    <span>{page.name}</span>{page.visibility.base ? null : <small>Hidden</small>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="visual-editor-page-actions" aria-label="Selected page actions">
              <button type="button" onClick={() => onMovePage(selectedPageId, "up")} disabled={selectedPageIndex <= 0} title={pageMoveUpBlocker}>Move up</button>
              <button type="button" onClick={() => onMovePage(selectedPageId, "down")} disabled={selectedPageIndex < 0 || selectedPageIndex === document.pages.length - 1} title={pageMoveDownBlocker}>Move down</button>
              <button type="button" onClick={() => onDuplicatePage(selectedPageId)}>Duplicate page</button>
              <button type="button" className="is-danger" disabled={Boolean(selectedPageRemovalBlocker)} title={selectedPageRemovalBlocker} onClick={() => {
                if (window.confirm("Delete this page and its local draft content? You can undo this change.")) onRemovePage(selectedPageId);
              }}>Delete page</button>
              <VisualEditorOperationNote messages={[
                pageMoveUpBlocker,
                pageMoveDownBlocker,
                selectedPageRemovalBlocker ? `Delete page is unavailable: ${selectedPageRemovalBlocker}` : undefined,
              ]} />
            </div>
          </section>
          <section aria-labelledby="visual-editor-layers-heading">
            <h2 id="visual-editor-layers-heading">Layers</h2>
            <ul className="visual-editor-layer-tree">
              {globalLayers.slice(0, 1).map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
              {layers.map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
              {globalLayers.slice(1).map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
            </ul>
          </section>
          <VisualEditorStructurePanel
            document={document}
            pageId={selectedPageId}
            nodeId={selectedNodeId}
            onInsertNode={onInsertNode}
            onDuplicateNode={onDuplicateNode}
            onMoveNode={onMoveNode}
            onNestNode={onNestNode}
            onUnnestNode={onUnnestNode}
            onRemoveNode={onRemoveNode}
          />
        </div>
      ) : null}
      {tab === "design" ? (
        <div className="visual-editor-left-scroll">
          <section className="visual-editor-design-panel" aria-labelledby="visual-editor-design-heading">
            <h2 id="visual-editor-design-heading">Site Design / Theme</h2>
            <p className="visual-editor-muted-note">Set the palette, page and surface defaults, global typography, and supported spacing scale. Components without local overrides inherit these tokens.</p>
            <button type="button" className={`visual-editor-design-select${selectedScope === "site" ? " is-selected" : ""}`} onClick={onSelectSite}>Open Site Design / Theme</button>
          </section>
        </div>
      ) : null}
      {tab === "globals" ? (
        <div className="visual-editor-left-scroll">
          <h2>Global components</h2>
          <div className="visual-editor-global-list">
            <button type="button" className={selectedScope === "site" ? "is-selected" : undefined} onClick={onSelectSite}>Site Design / Theme</button>
            {header ? <button type="button" className={selectedNodeId === header.id ? "is-selected" : undefined} onClick={() => onSelectNode(header.id)}>Header</button> : null}
            {footer ? <button type="button" className={selectedNodeId === footer.id ? "is-selected" : undefined} onClick={() => onSelectNode(footer.id)}>Footer</button> : null}
          </div>
        </div>
      ) : null}
      {tab === "navigation" ? <div className="visual-editor-left-scroll">{navigationPanel}</div> : null}
      {tab === "symbols" ? (
        <div className="visual-editor-left-scroll">
          <VisualEditorSymbols
            document={document}
            selectedPageId={selectedPageId}
            selectedNodeId={selectedNodeId}
            onCreate={onCreateSymbol}
            onInsert={onInsertSymbol}
            onRename={onRenameSymbol}
            onRemove={onRemoveSymbol}
            onSelectSource={(nodeId) => onSelectNode(nodeId, findVisualEditorNodePageId(document, nodeId))}
            onUnlinkInstance={onUnlinkSymbolInstance}
          />
        </div>
      ) : null}
    </aside>
  );
}
