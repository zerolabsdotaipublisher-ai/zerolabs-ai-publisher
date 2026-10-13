"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import { getVisualEditorGlobalLayers, getVisualEditorPageLayers, type VisualEditorLayerNode } from "@/lib/editor/visual";

type LeftPanelTab = "layers" | "globals" | "navigation" | "symbols";

interface VisualEditorLayersProps {
  document: EditorDocument;
  selectedPageId: EditorPageId;
  selectedNodeId?: EditorNodeId;
  expandedNodeIds: string[];
  onSelectPage: (pageId: EditorPageId) => void;
  onSelectNode: (nodeId: EditorNodeId, pageId?: EditorPageId) => void;
  onToggleExpanded: (nodeId: EditorNodeId) => void;
  navigationPanel: ReactNode;
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
  expandedNodeIds,
  onSelectPage,
  onSelectNode,
  onToggleExpanded,
  navigationPanel,
}: VisualEditorLayersProps) {
  const [tab, setTab] = useState<LeftPanelTab>("layers");
  const layers = getVisualEditorPageLayers(document, selectedPageId);
  const globalLayers = getVisualEditorGlobalLayers(document);
  const header = document.globals.header ? document.nodes[document.globals.header.nodeId] : undefined;
  const footer = document.globals.footer ? document.nodes[document.globals.footer.nodeId] : undefined;

  return (
    <aside className="visual-editor-left-panel" aria-label="Pages and layers">
      <div className="visual-editor-left-tabs" role="tablist" aria-label="Editor navigation">
        {(["layers", "globals", "navigation", "symbols"] as LeftPanelTab[]).map((candidate) => (
          <button key={candidate} type="button" role="tab" aria-selected={tab === candidate} className={tab === candidate ? "is-active" : undefined} onClick={() => setTab(candidate)}>
            {candidate === "layers" ? "Pages" : candidate === "globals" ? "Globals" : candidate === "navigation" ? "Navigation" : "Symbols"}
          </button>
        ))}
      </div>
      {tab === "layers" ? (
        <div className="visual-editor-left-scroll">
          <section aria-labelledby="visual-editor-pages-heading">
            <h2 id="visual-editor-pages-heading">Pages</h2>
            <ul className="visual-editor-page-list">
              {document.pages.map((page) => (
                <li key={page.id}>
                  <button type="button" className={selectedPageId === page.id && !selectedNodeId ? "is-selected" : undefined} onClick={() => onSelectPage(page.id)}>
                    <span>{page.name}</span>{page.visibility.base ? null : <small>Hidden</small>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="visual-editor-layers-heading">
            <h2 id="visual-editor-layers-heading">Layers</h2>
            <ul className="visual-editor-layer-tree">
              {globalLayers.slice(0, 1).map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
              {layers.map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
              {globalLayers.slice(1).map((layer) => <LayerNode key={layer.id} node={layer} selectedNodeId={selectedNodeId} expandedNodeIds={expandedNodeIds} pageId={selectedPageId} depth={0} onSelect={onSelectNode} onToggle={onToggleExpanded} />)}
            </ul>
          </section>
        </div>
      ) : null}
      {tab === "globals" ? (
        <div className="visual-editor-left-scroll">
          <h2>Global components</h2>
          <div className="visual-editor-global-list">
            {header ? <button type="button" className={selectedNodeId === header.id ? "is-selected" : undefined} onClick={() => onSelectNode(header.id)}>Header</button> : null}
            {footer ? <button type="button" className={selectedNodeId === footer.id ? "is-selected" : undefined} onClick={() => onSelectNode(footer.id)}>Footer</button> : null}
          </div>
        </div>
      ) : null}
      {tab === "navigation" ? <div className="visual-editor-left-scroll">{navigationPanel}</div> : null}
      {tab === "symbols" ? (
        <div className="visual-editor-left-scroll">
          <h2>Reusable components</h2>
          <p className="visual-editor-muted-note">Symbols will be managed here in Slice 6. No reusable components are changed by this draft-only editor.</p>
        </div>
      ) : null}
    </aside>
  );
}
