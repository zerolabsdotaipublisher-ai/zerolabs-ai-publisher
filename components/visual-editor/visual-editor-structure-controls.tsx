"use client";

import { useState } from "react";
import type { EditorDocument, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import {
  getVisualEditorDuplicateBlocker,
  getVisualEditorInsertOptions,
  getVisualEditorMoveAvailability,
  getVisualEditorNestBlocker,
  getVisualEditorPageInsertTargets,
  getVisualEditorRemovalBlocker,
  getVisualEditorUnnestBlocker,
  type VisualEditorInsertOption,
  type VisualEditorInsertTarget,
} from "@/lib/editor/visual";
import { VisualEditorOperationNote } from "./visual-editor-operation-note";

interface VisualEditorNodeActionCallbacks {
  onDuplicateNode: (nodeId: EditorNodeId) => void;
  onMoveNode: (nodeId: EditorNodeId, direction: "up" | "down") => void;
  onNestNode: (nodeId: EditorNodeId) => void;
  onUnnestNode: (nodeId: EditorNodeId) => void;
  onDeleteNode: (nodeId: EditorNodeId) => void;
}

interface VisualEditorAddElementPickerProps {
  document: EditorDocument;
  pageId: EditorPageId;
  destinationNodeId?: EditorNodeId;
  onInsertNode: (target: VisualEditorInsertTarget, nodeType: string) => void;
  compact?: boolean;
}

function targetKey(target: VisualEditorInsertTarget): string {
  return `${target.parentId}:${target.slotName}`;
}

function getInsertTargets(document: EditorDocument, pageId: EditorPageId, destinationNodeId?: EditorNodeId): VisualEditorInsertTarget[] {
  const destination = destinationNodeId ? document.nodes[destinationNodeId] : undefined;
  const selectedNodeTargets = destination
    ? Object.keys(destination.slots).map((slotName) => ({ parentId: destination.id, slotName, label: `Inside selected element · ${slotName}` }))
    : [];
  const pageTargets = getVisualEditorPageInsertTargets(document, pageId).map((target) => ({ ...target, label: `Page · ${target.label}` }));
  return [...selectedNodeTargets, ...pageTargets].filter((target, index, candidates) =>
    candidates.findIndex((candidate) => targetKey(candidate) === targetKey(target)) === index && getVisualEditorInsertOptions(document, target).length > 0,
  );
}

function optionsByCategory(options: VisualEditorInsertOption[]): [string, VisualEditorInsertOption[]][] {
  const grouped = new Map<string, VisualEditorInsertOption[]>();
  options.forEach((option) => grouped.set(option.category, [...(grouped.get(option.category) ?? []), option]));
  return [...grouped.entries()];
}

/** Registry-filtered insertion controls. They select a legal target but never mutate the document directly. */
export function VisualEditorAddElementPicker({
  document,
  pageId,
  destinationNodeId,
  onInsertNode,
  compact = false,
}: VisualEditorAddElementPickerProps) {
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>();
  const [selectedType, setSelectedType] = useState<string>();
  const targets = getInsertTargets(document, pageId, destinationNodeId);
  const activeTarget = targets.find((target) => targetKey(target) === selectedTargetKey) ?? targets[0];
  const insertOptions = activeTarget ? getVisualEditorInsertOptions(document, activeTarget) : [];
  const activeType = insertOptions.some((option) => option.type === selectedType) ? selectedType : insertOptions[0]?.type;
  const groups = optionsByCategory(insertOptions);
  const addBlocker = !activeTarget
    ? "Add element is unavailable: no registry-compatible destination is available here."
    : !activeType
      ? "Add element is unavailable: this destination has no supported element types."
      : undefined;

  return (
    <div className={`visual-editor-add-picker${compact ? " is-compact" : ""}`}>
      <label>
        <span>Insert into</span>
        <select value={activeTarget ? targetKey(activeTarget) : ""} disabled={!targets.length} title={!targets.length ? addBlocker : undefined} onChange={(event) => setSelectedTargetKey(event.target.value)}>
          {targets.map((target) => <option key={targetKey(target)} value={targetKey(target)}>{target.label}</option>)}
        </select>
      </label>
      <label>
        <span>Element</span>
        <select value={activeType ?? ""} disabled={!insertOptions.length} title={!insertOptions.length ? addBlocker : undefined} onChange={(event) => setSelectedType(event.target.value)}>
          {groups.map(([category, options]) => (
            <optgroup key={category} label={category[0].toUpperCase() + category.slice(1)}>
              {options.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => activeTarget && activeType && onInsertNode(activeTarget, activeType)} disabled={!activeTarget || !activeType} title={addBlocker}>Add element</button>
      <VisualEditorOperationNote messages={[addBlocker]} />
    </div>
  );
}

/** Selected-node controls shared by the layer panel and live canvas. */
export function VisualEditorNodeActionBar({
  document,
  nodeId,
  onDuplicateNode,
  onMoveNode,
  onNestNode,
  onUnnestNode,
  onDeleteNode,
}: { document: EditorDocument; nodeId: EditorNodeId } & VisualEditorNodeActionCallbacks) {
  const node = document.nodes[nodeId];
  if (!node) return null;
  const duplicateBlocker = getVisualEditorDuplicateBlocker(document, node.id);
  const removalBlocker = getVisualEditorRemovalBlocker(document, node.id);
  const moveAvailability = getVisualEditorMoveAvailability(document, node.id);
  const nestBlocker = getVisualEditorNestBlocker(document, node.id);
  const unnestBlocker = getVisualEditorUnnestBlocker(document, node.id);
  const moveUpBlocker = moveAvailability.up ? undefined : "Move up is unavailable: there is no earlier editable sibling.";
  const moveDownBlocker = moveAvailability.down ? undefined : "Move down is unavailable: there is no later editable sibling.";

  return (
    <div className="visual-editor-node-action-bar" role="toolbar" aria-label={`Actions for ${node.type}`}>
      <span className="visual-editor-node-action-label">{node.type}</span>
      <button type="button" onClick={() => onMoveNode(node.id, "up")} disabled={!moveAvailability.up} title={moveUpBlocker}>Move up</button>
      <button type="button" onClick={() => onMoveNode(node.id, "down")} disabled={!moveAvailability.down} title={moveDownBlocker}>Move down</button>
      <button type="button" onClick={() => onNestNode(node.id)} disabled={Boolean(nestBlocker)} title={nestBlocker}>Nest</button>
      <button type="button" onClick={() => onUnnestNode(node.id)} disabled={Boolean(unnestBlocker)} title={unnestBlocker}>Unnest</button>
      <button type="button" onClick={() => onDuplicateNode(node.id)} disabled={Boolean(duplicateBlocker)} title={duplicateBlocker}>Duplicate</button>
      <button
        type="button"
        className="is-danger"
        onClick={() => {
          if (window.confirm("Delete this element and its nested contents from the local draft? You can undo this change.")) onDeleteNode(node.id);
        }}
        disabled={Boolean(removalBlocker)}
        title={removalBlocker}
      >
        Delete
      </button>
      <VisualEditorOperationNote messages={[
        moveUpBlocker,
        moveDownBlocker,
        nestBlocker ? `Nest is unavailable: ${nestBlocker}` : undefined,
        unnestBlocker ? `Unnest is unavailable: ${unnestBlocker}` : undefined,
        duplicateBlocker ? `Duplicate is unavailable: ${duplicateBlocker}` : undefined,
        removalBlocker ? `Delete is unavailable: ${removalBlocker}` : undefined,
      ]} />
    </div>
  );
}
