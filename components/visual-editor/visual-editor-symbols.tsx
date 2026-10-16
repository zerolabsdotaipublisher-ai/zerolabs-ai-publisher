"use client";

import { useState } from "react";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import {
  getVisualEditorInsertableSymbols,
  getVisualEditorPageInsertTargets,
  getVisualEditorSymbolCreateBlocker,
  getVisualEditorSymbolRemovalBlocker,
  getVisualEditorSymbols,
  type VisualEditorInsertTarget,
} from "@/lib/editor/visual";
import { VisualEditorOperationNote } from "./visual-editor-operation-note";

interface VisualEditorSymbolsProps {
  document: EditorDocument;
  selectedPageId: EditorPageId;
  selectedNodeId?: EditorNodeId;
  onCreate: (nodeId: EditorNodeId, name?: string) => void;
  onInsert: (target: VisualEditorInsertTarget, symbolId: string) => void;
  onRename: (symbolId: string, name: string) => void;
  onRemove: (symbolId: string) => void;
  onSelectSource: (nodeId: EditorNodeId) => void;
  onUnlinkInstance: (nodeId: EditorNodeId) => void;
}

function targetKey(target: VisualEditorInsertTarget): string {
  return `${target.parentId}:${target.slotName}`;
}

export function VisualEditorSymbols({
  document,
  selectedPageId,
  selectedNodeId,
  onCreate,
  onInsert,
  onRename,
  onRemove,
  onSelectSource,
  onUnlinkInstance,
}: VisualEditorSymbolsProps) {
  const [newSymbolName, setNewSymbolName] = useState("");
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>();
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>();
  const selectedNode = selectedNodeId ? document.nodes[selectedNodeId] : undefined;
  const sourceBlocker = selectedNode ? getVisualEditorSymbolCreateBlocker(document, selectedNode.id) : "Select an element from the page tree to make it reusable.";
  const selectedNodeTargets = selectedNode
    ? Object.keys(selectedNode.slots).map((slotName) => ({ parentId: selectedNode.id, slotName, label: `Inside selected element · ${slotName}` }))
    : [];
  const pageTargets = getVisualEditorPageInsertTargets(document, selectedPageId).map((target) => ({ ...target, label: `Page · ${target.label}` }));
  const targets = [...selectedNodeTargets, ...pageTargets].filter((target, index, candidates) =>
    candidates.findIndex((candidate) => targetKey(candidate) === targetKey(target)) === index && getVisualEditorInsertableSymbols(document, target).length > 0,
  );
  const activeTarget = targets.find((target) => targetKey(target) === selectedTargetKey) ?? targets[0];
  const availableSymbols = activeTarget ? getVisualEditorInsertableSymbols(document, activeTarget) : [];
  const activeSymbolId = availableSymbols.some((symbol) => symbol.id === selectedSymbolId) ? selectedSymbolId : availableSymbols[0]?.id;
  const symbols = getVisualEditorSymbols(document);
  const insertBlocker = !activeTarget
    ? "Insert linked instance is unavailable: no compatible destination is available for the reusable components in this draft."
    : !activeSymbolId
      ? "Insert linked instance is unavailable: no reusable component fits the selected destination."
      : undefined;

  return (
    <section className="visual-editor-symbols-panel" aria-labelledby="visual-editor-symbols-heading">
      <div>
        <h2 id="visual-editor-symbols-heading">Reusable components</h2>
        <p className="visual-editor-muted-note">Linked instances use the source element’s current content and styles. All changes are local to this draft.</p>
      </div>
      <section className="visual-editor-symbol-create" aria-labelledby="visual-editor-symbol-create-heading">
        <h3 id="visual-editor-symbol-create-heading">Make selected element reusable</h3>
        <label>
          <span>Name</span>
          <input value={newSymbolName} placeholder="Reusable component" onChange={(event) => setNewSymbolName(event.target.value)} disabled={!selectedNode || Boolean(sourceBlocker)} title={sourceBlocker} />
        </label>
        <button type="button" onClick={() => selectedNode && onCreate(selectedNode.id, newSymbolName)} disabled={!selectedNode || Boolean(sourceBlocker)} title={sourceBlocker}>Create reusable component</button>
        <VisualEditorOperationNote messages={[sourceBlocker ? `Create reusable component is unavailable: ${sourceBlocker}` : undefined]} />
      </section>
      {selectedNode?.symbolReference ? (
        <section className="visual-editor-symbol-instance">
          <h3>Linked instance selected</h3>
          <button type="button" onClick={() => onUnlinkInstance(selectedNode.id)}>Detach instance</button>
        </section>
      ) : null}
      <section className="visual-editor-symbol-insert" aria-labelledby="visual-editor-symbol-insert-heading">
        <h3 id="visual-editor-symbol-insert-heading">Insert a linked instance</h3>
        <label>
          <span>Insert into</span>
          <select value={activeTarget ? targetKey(activeTarget) : ""} disabled={!targets.length} title={!targets.length ? insertBlocker : undefined} onChange={(event) => setSelectedTargetKey(event.target.value)}>
            {targets.map((target) => <option key={targetKey(target)} value={targetKey(target)}>{target.label}</option>)}
          </select>
        </label>
        <label>
          <span>Reusable component</span>
          <select value={activeSymbolId ?? ""} disabled={!availableSymbols.length} title={!availableSymbols.length ? insertBlocker : undefined} onChange={(event) => setSelectedSymbolId(event.target.value)}>
            {availableSymbols.map((symbol) => <option key={symbol.id} value={symbol.id}>{symbol.name}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => activeTarget && activeSymbolId && onInsert(activeTarget, activeSymbolId)} disabled={!activeTarget || !activeSymbolId} title={insertBlocker}>Insert linked instance</button>
        <VisualEditorOperationNote messages={[insertBlocker]} />
      </section>
      <section className="visual-editor-symbol-list" aria-labelledby="visual-editor-symbol-list-heading">
        <h3 id="visual-editor-symbol-list-heading">Library</h3>
        {symbols.length ? (
          <ul>
            {symbols.map((symbol) => {
              const removalBlocker = getVisualEditorSymbolRemovalBlocker(document, symbol.id);
              return (
                <li key={symbol.id}>
                  <label>
                    <span>Name</span>
                    <input value={symbol.name} onChange={(event) => onRename(symbol.id, event.target.value)} />
                  </label>
                  <p>{symbol.type} · {symbol.instanceCount} linked instance{symbol.instanceCount === 1 ? "" : "s"}</p>
                  <div>
                    <button type="button" onClick={() => onSelectSource(symbol.rootNodeId)}>Edit source</button>
                    <button
                      type="button"
                      className="is-danger"
                      disabled={Boolean(removalBlocker)}
                      title={removalBlocker}
                      onClick={() => {
                        if (window.confirm(`Delete “${symbol.name}” from the local reusable-component library?`)) onRemove(symbol.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <VisualEditorOperationNote messages={[removalBlocker ? `Delete reusable component is unavailable: ${removalBlocker}` : undefined]} />
                </li>
              );
            })}
          </ul>
        ) : <p className="visual-editor-muted-note">No reusable components yet.</p>}
      </section>
    </section>
  );
}
