import { validateEditorDocument, type EditorDocument, type EditorNode, type EditorNodeId, type EditorPageId, type EditorSymbolId } from "@/lib/editor/document";
import { editorComponentRegistry, getComponentDefinition, getComponentDefaultProps, type ComponentDefinition } from "@/lib/editor/registry";
import { typeMatchesPattern } from "@/lib/editor/registry/definitions";

export interface VisualEditorNodeLocation {
  pageId?: EditorPageId;
  parentId?: EditorNodeId;
  slotName?: string;
  index: number;
  isPageRoot: boolean;
}

export interface VisualEditorInsertTarget {
  parentId: EditorNodeId;
  slotName: string;
  label: string;
}

export interface VisualEditorInsertOption {
  type: string;
  label: string;
  category: string;
}

export interface VisualEditorStructureChange {
  document: EditorDocument;
  nodeId: EditorNodeId;
}

/**
 * The sole reducer-facing API for page-tree mutations. Keeping this union here
 * makes each structural change pass through the same immutable validation gate.
 */
export type VisualEditorStructuralCommand =
  | { type: "insert-node"; target: VisualEditorInsertTarget; nodeType: string }
  | { type: "duplicate-node"; nodeId: EditorNodeId }
  | { type: "move-node"; nodeId: EditorNodeId; direction: "up" | "down" }
  | { type: "nest-node"; nodeId: EditorNodeId }
  | { type: "unnest-node"; nodeId: EditorNodeId }
  | { type: "remove-node"; nodeId: EditorNodeId };

export interface VisualEditorStructuralCommandResult {
  document: EditorDocument;
  insertedNodeId?: EditorNodeId;
}

export interface VisualEditorSymbolOption {
  id: EditorSymbolId;
  name: string;
  rootNodeId: EditorNodeId;
  type: string;
  instanceCount: number;
}

function canContain(parent: EditorNode, slotName: string, child: ComponentDefinition): boolean {
  const parentDefinition = getComponentDefinition(parent.type);
  const slot = parentDefinition?.slots[slotName];
  if (!slot) return false;
  if (slot.maxChildren !== undefined && (parent.slots[slotName]?.childIds.length ?? 0) >= slot.maxChildren) return false;
  if (!slot.allowedChildTypes.some((pattern) => typeMatchesPattern(child.type, pattern))) return false;
  return !child.allowedParentTypes || child.allowedParentTypes.some((pattern) => typeMatchesPattern(parent.type, pattern));
}

function valueAtPath(value: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) =>
    current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>)[key] : undefined,
  value);
}

/** Structural insertion never creates a known-invalid intermediate document. */
function hasCreatableDefaults(definition: ComponentDefinition): boolean {
  return definition.propSchema
    .filter((property) => property.required)
    .every((property) => {
      const value = valueAtPath(definition.defaultProps, property.path);
      return value !== undefined && value !== null && (typeof value !== "string" || value.trim().length > 0);
    });
}

function nodeIdBase(type: string): string {
  return `editor-${type.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function allocateNodeId(nodes: Record<string, EditorNode>, type: string): EditorNodeId {
  const base = nodeIdBase(type);
  let suffix = 1;
  let candidate = `${base}-${suffix}`;
  while (nodes[candidate]) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function symbolIdBase(type: string): string {
  return `symbol-${type.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function allocateSymbolId(document: EditorDocument, type: string): EditorSymbolId {
  const base = symbolIdBase(type);
  let suffix = 1;
  let candidate = `${base}-${suffix}`;
  while (document.globals.symbols[candidate]) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function definitionHasRequiredChildren(definition: ComponentDefinition): boolean {
  return Object.values(definition.slots).some((slot) => (slot.minChildren ?? 0) > 0);
}

function createNodeWithRequiredChildren(
  nodes: Record<string, EditorNode>,
  type: string,
): EditorNodeId | undefined {
  const definition = getComponentDefinition(type);
  const defaultProps = getComponentDefaultProps(type);
  if (!definition || !defaultProps || !hasCreatableDefaults(definition)) return undefined;

  const id = allocateNodeId(nodes, type);
  const node: EditorNode = {
    id,
    type,
    kind: definition.kind,
    props: defaultProps,
    visibility: { base: true },
    slots: Object.fromEntries(Object.keys(definition.slots).map((slotName) => [slotName, { name: slotName, childIds: [] }])),
  };
  nodes[id] = node;

  for (const slot of Object.values(definition.slots)) {
    for (let index = 0; index < (slot.minChildren ?? 0); index += 1) {
      const childDefinition = editorComponentRegistry.list().find((candidate) => hasCreatableDefaults(candidate) && canContain(node, slot.name, candidate));
      const childId = childDefinition ? createNodeWithRequiredChildren(nodes, childDefinition.type) : undefined;
      if (!childId) {
        delete nodes[id];
        return undefined;
      }
      node.slots[slot.name].childIds.push(childId);
    }
  }

  return id;
}

function collectSubtreeNodeIds(document: EditorDocument, nodeId: EditorNodeId, collected = new Set<EditorNodeId>()): Set<EditorNodeId> {
  if (collected.has(nodeId) || !document.nodes[nodeId]) return collected;
  collected.add(nodeId);
  Object.values(document.nodes[nodeId].slots).forEach((slot) => {
    slot.childIds.forEach((childId) => collectSubtreeNodeIds(document, childId, collected));
  });
  return collected;
}

function containsNodeTarget(value: unknown, removedNodeIds: Set<EditorNodeId>): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsNodeTarget(entry, removedNodeIds));
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.kind === "node" && typeof record.nodeId === "string" && removedNodeIds.has(record.nodeId)) return true;
  return Object.values(record).some((entry) => containsNodeTarget(entry, removedNodeIds));
}

function navigationTargetsNode(items: EditorDocument["navigation"]["menus"][number]["items"], removedNodeIds: Set<EditorNodeId>): boolean {
  return items.some((item) =>
    (item.target.kind === "node" && removedNodeIds.has(item.target.nodeId)) || navigationTargetsNode(item.children, removedNodeIds),
  );
}

function remapCopiedNodeTargets(value: unknown, copiedIds: Record<EditorNodeId, EditorNodeId>): unknown {
  if (Array.isArray(value)) return value.map((entry) => remapCopiedNodeTargets(entry, copiedIds));
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.kind === "node" && typeof record.nodeId === "string" && copiedIds[record.nodeId]) {
    return { ...record, nodeId: copiedIds[record.nodeId] };
  }
  return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, remapCopiedNodeTargets(entry, copiedIds)]));
}

function withoutLegacyMetadata(node: EditorNode, id: EditorNodeId, childIds: Record<EditorNodeId, EditorNodeId>): EditorNode {
  const nodeWithoutLegacyMetadata = structuredClone(node);
  delete nodeWithoutLegacyMetadata.legacy;
  const slots = Object.fromEntries(Object.entries(node.slots).map(([slotName, slot]) => [
    slotName,
    { name: slot.name, childIds: slot.childIds.map((childId) => childIds[childId]) },
  ]));
  const definition = getComponentDefinition(node.type);
  return {
    ...nodeWithoutLegacyMetadata,
    id,
    kind: definition?.kind ?? node.kind,
    props: remapCopiedNodeTargets(node.props, childIds) as EditorNode["props"],
    slots,
    ...(definition ? {} : { legacy: node.legacy }),
  };
}

/** Finds a node's one valid tree location, including a page root location. */
export function getVisualEditorNodeLocation(document: EditorDocument, nodeId: EditorNodeId): VisualEditorNodeLocation | undefined {
  for (const page of document.pages) {
    const rootIndex = page.rootNodeIds.indexOf(nodeId);
    if (rootIndex >= 0) return { pageId: page.id, index: rootIndex, isPageRoot: true };
  }

  for (const [parentId, parent] of Object.entries(document.nodes)) {
    for (const [slotName, slot] of Object.entries(parent.slots)) {
      const index = slot.childIds.indexOf(nodeId);
      if (index < 0) continue;
      const pageId = document.pages.find((page) => page.rootNodeIds.some((rootId) => collectSubtreeNodeIds(document, rootId).has(parentId)))?.id;
      return { pageId, parentId, slotName, index, isPageRoot: false };
    }
  }
  return undefined;
}

/** Lists legal registry-backed child choices for a particular parent slot. */
export function getVisualEditorInsertOptions(document: EditorDocument, target: VisualEditorInsertTarget): VisualEditorInsertOption[] {
  const parent = document.nodes[target.parentId];
  if (!parent) return [];
  return editorComponentRegistry.list()
    .filter((definition) => !definition.allowedAsPageRoot && !definition.type.startsWith("site.") && hasCreatableDefaults(definition) && canContain(parent, target.slotName, definition))
    .map((definition) => ({ type: definition.type, label: definition.label, category: definition.category }));
}

/** Lists the legal insertion points exposed for a page. */
export function getVisualEditorPageInsertTargets(document: EditorDocument, pageId: EditorPageId): VisualEditorInsertTarget[] {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page) return [];
  return page.rootNodeIds.flatMap((rootId) => {
    const root = document.nodes[rootId];
    const definition = root ? getComponentDefinition(root.type) : undefined;
    if (!root || !definition) return [];
    return Object.keys(definition.slots)
      .map((slotName) => ({ parentId: root.id, slotName, label: `${definition.label} · ${slotName}` }))
      .filter((target) => getVisualEditorInsertOptions(document, target).length > 0);
  });
}

/** Appends a complete registry-valid node (and any required children) into a legal slot. */
export function insertVisualEditorNode(
  document: EditorDocument,
  target: VisualEditorInsertTarget,
  type: string,
): VisualEditorStructureChange | undefined {
  if (!getVisualEditorInsertOptions(document, target).some((option) => option.type === type)) return undefined;
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  const id = createNodeWithRequiredChildren(nodes, type);
  const parent = nodes[target.parentId];
  if (!id || !parent?.slots[target.slotName]) return undefined;
  parent.slots[target.slotName].childIds.push(id);
  return { document: { ...document, nodes }, nodeId: id };
}

export function getVisualEditorDuplicateBlocker(document: EditorDocument, nodeId: EditorNodeId): string | undefined {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location) return "Global and reusable roots cannot be duplicated from the page tree.";
  const root = document.nodes[nodeId];
  if (!root) return "This element no longer exists.";
  if (location.isPageRoot || getComponentDefinition(root.type)?.allowedAsPageRoot) return "Page roots cannot be duplicated.";
  const parentSlot = location.parentId && location.slotName ? getComponentDefinition(document.nodes[location.parentId]?.type ?? "")?.slots[location.slotName] : undefined;
  if (parentSlot?.maxChildren !== undefined && (document.nodes[location.parentId!].slots[location.slotName!]?.childIds.length ?? 0) >= parentSlot.maxChildren) {
    return `This slot allows a maximum of ${parentSlot.maxChildren} elements.`;
  }
  for (const candidateId of collectSubtreeNodeIds(document, nodeId)) {
    if (!getComponentDefinition(document.nodes[candidateId]?.type ?? "")) return "Legacy nodes without a registry definition cannot be duplicated.";
  }
  return undefined;
}

/** Duplicates a registry-backed subtree next to its source without reusing legacy source identities. */
export function duplicateVisualEditorNode(document: EditorDocument, nodeId: EditorNodeId): VisualEditorStructureChange | undefined {
  const blocker = getVisualEditorDuplicateBlocker(document, nodeId);
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (blocker || !location?.parentId || !location.slotName) return undefined;

  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  const sourceIds = [...collectSubtreeNodeIds(document, nodeId)];
  const clonedIds = sourceIds.reduce<Record<EditorNodeId, EditorNodeId>>((result, sourceId) => {
    result[sourceId] = allocateNodeId(nodes, document.nodes[sourceId].type);
    // Reserve IDs before cloning so siblings receive distinct identities.
    nodes[result[sourceId]] = { ...document.nodes[sourceId], id: result[sourceId], slots: {} };
    return result;
  }, {});

  sourceIds.forEach((sourceId) => {
    const clonedId = clonedIds[sourceId];
    nodes[clonedId] = withoutLegacyMetadata(document.nodes[sourceId], clonedId, clonedIds);
  });

  const siblings = nodes[location.parentId].slots[location.slotName].childIds;
  siblings.splice(location.index + 1, 0, clonedIds[nodeId]);
  return { document: { ...document, nodes }, nodeId: clonedIds[nodeId] };
}

export function getVisualEditorRemovalBlocker(document: EditorDocument, nodeId: EditorNodeId): string | undefined {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location) return "Global and reusable roots cannot be removed from the page tree.";
  if (location.isPageRoot) return "Page roots cannot be removed.";
  const parentSlot = location.parentId && location.slotName ? getComponentDefinition(document.nodes[location.parentId]?.type ?? "")?.slots[location.slotName] : undefined;
  if (parentSlot?.minChildren !== undefined && (document.nodes[location.parentId!].slots[location.slotName!]?.childIds.length ?? 0) <= parentSlot.minChildren) {
    return `This slot requires at least ${parentSlot.minChildren} element${parentSlot.minChildren === 1 ? "" : "s"}.`;
  }
  const removedNodeIds = collectSubtreeNodeIds(document, nodeId);
  if ([document.globals.header?.nodeId, document.globals.footer?.nodeId].some((globalId) => globalId && removedNodeIds.has(globalId))) {
    return "This element is used by a global component.";
  }
  if (Object.values(document.globals.symbols).some((symbol) => removedNodeIds.has(symbol.rootNodeId))) {
    return "This element is the root of a reusable component.";
  }
  if (document.navigation.menus.some((menu) => navigationTargetsNode(menu.items, removedNodeIds))) {
    return "Update navigation links to this element before removing it.";
  }
  if (Object.entries(document.nodes).some(([candidateId, candidate]) => !removedNodeIds.has(candidateId) && containsNodeTarget(candidate.props, removedNodeIds))) {
    return "Update element links to this content before removing it.";
  }
  return undefined;
}

/** Removes a complete unreferenced subtree. The operation is local and can be undone. */
export function removeVisualEditorNode(document: EditorDocument, nodeId: EditorNodeId): EditorDocument | undefined {
  const blocker = getVisualEditorRemovalBlocker(document, nodeId);
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (blocker || !location?.parentId || !location.slotName) return undefined;
  const removedNodeIds = collectSubtreeNodeIds(document, nodeId);
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  nodes[location.parentId].slots[location.slotName].childIds.splice(location.index, 1);
  removedNodeIds.forEach((removedId) => delete nodes[removedId]);
  return { ...document, nodes };
}

export function getVisualEditorMoveAvailability(document: EditorDocument, nodeId: EditorNodeId): { up: boolean; down: boolean } {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location) return { up: false, down: false };
  const siblings = location.isPageRoot
    ? document.pages.find((page) => page.id === location.pageId)?.rootNodeIds ?? []
    : document.nodes[location.parentId ?? ""]?.slots[location.slotName ?? ""]?.childIds ?? [];
  return { up: location.index > 0, down: location.index < siblings.length - 1 };
}

/** Moves a node among siblings only, preserving the document's containment rules. */
export function moveVisualEditorNode(document: EditorDocument, nodeId: EditorNodeId, direction: "up" | "down"): EditorDocument | undefined {
  const availability = getVisualEditorMoveAvailability(document, nodeId);
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location || !availability[direction]) return undefined;
  const offset = direction === "up" ? -1 : 1;
  if (location.isPageRoot && location.pageId) {
    return {
      ...document,
      pages: document.pages.map((page) => {
        if (page.id !== location.pageId) return page;
        const rootNodeIds = [...page.rootNodeIds];
        [rootNodeIds[location.index], rootNodeIds[location.index + offset]] = [rootNodeIds[location.index + offset], rootNodeIds[location.index]];
        return { ...page, rootNodeIds };
      }),
    };
  }
  if (!location.parentId || !location.slotName) return undefined;
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  const siblings = nodes[location.parentId].slots[location.slotName].childIds;
  [siblings[location.index], siblings[location.index + offset]] = [siblings[location.index + offset], siblings[location.index]];
  return { ...document, nodes };
}

function getParentSlotDefinition(document: EditorDocument, location: VisualEditorNodeLocation): ComponentDefinition["slots"][string] | undefined {
  if (!location.parentId || !location.slotName) return undefined;
  return getComponentDefinition(document.nodes[location.parentId]?.type ?? "")?.slots[location.slotName];
}

function canRemoveFromLocation(document: EditorDocument, location: VisualEditorNodeLocation): boolean {
  const slot = getParentSlotDefinition(document, location);
  const childCount = location.parentId && location.slotName ? document.nodes[location.parentId]?.slots[location.slotName]?.childIds.length ?? 0 : 0;
  return !slot?.minChildren || childCount > slot.minChildren;
}

function firstNestTarget(document: EditorDocument, nodeId: EditorNodeId): VisualEditorInsertTarget | undefined {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location?.parentId || !location.slotName || location.index === 0 || !canRemoveFromLocation(document, location)) return undefined;
  const siblingId = document.nodes[location.parentId].slots[location.slotName].childIds[location.index - 1];
  const sibling = document.nodes[siblingId];
  const nodeDefinition = getComponentDefinition(document.nodes[nodeId]?.type ?? "");
  if (!sibling || !nodeDefinition) return undefined;
  return Object.keys(sibling.slots)
    .map((slotName) => ({ parentId: sibling.id, slotName, label: `Inside ${sibling.id}` }))
    .find((target) => canContain(sibling, target.slotName, nodeDefinition));
}

/** Explains why a node cannot be nested one level beneath its preceding sibling. */
export function getVisualEditorNestBlocker(document: EditorDocument, nodeId: EditorNodeId): string | undefined {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location?.parentId || !location.slotName || location.isPageRoot) return "Page roots and global elements cannot be nested.";
  if (!canRemoveFromLocation(document, location)) return "This parent slot requires the selected element to remain in place.";
  if (location.index === 0) return "Move this element below a compatible sibling before nesting it.";
  return firstNestTarget(document, nodeId) ? undefined : "The preceding sibling has no compatible child slot.";
}

/** Nests a node into the first compatible slot on its preceding sibling. */
export function nestVisualEditorNode(document: EditorDocument, nodeId: EditorNodeId): EditorDocument | undefined {
  const blocker = getVisualEditorNestBlocker(document, nodeId);
  const location = getVisualEditorNodeLocation(document, nodeId);
  const target = firstNestTarget(document, nodeId);
  if (blocker || !location?.parentId || !location.slotName || !target) return undefined;
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  nodes[location.parentId].slots[location.slotName].childIds.splice(location.index, 1);
  nodes[target.parentId].slots[target.slotName].childIds.push(nodeId);
  return { ...document, nodes };
}

/** Explains why a node cannot be moved one level outward beside its current parent. */
export function getVisualEditorUnnestBlocker(document: EditorDocument, nodeId: EditorNodeId): string | undefined {
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (!location?.parentId || !location.slotName || location.isPageRoot) return "Page roots and global elements cannot be moved outward.";
  if (!canRemoveFromLocation(document, location)) return "This parent slot requires the selected element to remain in place.";
  const parentLocation = getVisualEditorNodeLocation(document, location.parentId);
  if (!parentLocation?.parentId || !parentLocation.slotName || parentLocation.isPageRoot) return "This element is already at the outermost level.";
  const nodeDefinition = getComponentDefinition(document.nodes[nodeId]?.type ?? "");
  const grandparent = document.nodes[parentLocation.parentId];
  if (!nodeDefinition || !grandparent || !canContain(grandparent, parentLocation.slotName, nodeDefinition)) {
    return "The outer parent does not allow this element type.";
  }
  return undefined;
}

/** Moves a node out beside its current parent, preserving both slot contracts. */
export function unnestVisualEditorNode(document: EditorDocument, nodeId: EditorNodeId): EditorDocument | undefined {
  const blocker = getVisualEditorUnnestBlocker(document, nodeId);
  const location = getVisualEditorNodeLocation(document, nodeId);
  if (blocker || !location?.parentId || !location.slotName) return undefined;
  const parentLocation = getVisualEditorNodeLocation(document, location.parentId);
  if (!parentLocation?.parentId || !parentLocation.slotName) return undefined;
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  nodes[location.parentId].slots[location.slotName].childIds.splice(location.index, 1);
  nodes[parentLocation.parentId].slots[parentLocation.slotName].childIds.splice(parentLocation.index + 1, 0, nodeId);
  return { ...document, nodes };
}

function finalizeStructuralCommand(
  candidate: EditorDocument | undefined,
  insertedNodeId?: EditorNodeId,
): VisualEditorStructuralCommandResult | undefined {
  if (!candidate || validateEditorDocument(candidate).length > 0) return undefined;
  return { document: candidate, ...(insertedNodeId ? { insertedNodeId } : {}) };
}

/**
 * Executes one immutable page-tree command only when it preserves the complete
 * EditorDocument contract. Registry slot checks make invalid placements
 * unavailable up front; this final validation gate protects graph integrity,
 * IDs, references, cycles, and slot contracts before state can change.
 */
export function executeVisualEditorStructuralCommand(
  document: EditorDocument,
  command: VisualEditorStructuralCommand,
): VisualEditorStructuralCommandResult | undefined {
  if (validateEditorDocument(document).length > 0) return undefined;

  switch (command.type) {
    case "insert-node": {
      const change = insertVisualEditorNode(document, command.target, command.nodeType);
      return finalizeStructuralCommand(change?.document, change?.nodeId);
    }
    case "duplicate-node": {
      const change = duplicateVisualEditorNode(document, command.nodeId);
      return finalizeStructuralCommand(change?.document, change?.nodeId);
    }
    case "move-node":
      return finalizeStructuralCommand(moveVisualEditorNode(document, command.nodeId, command.direction));
    case "nest-node":
      return finalizeStructuralCommand(nestVisualEditorNode(document, command.nodeId));
    case "unnest-node":
      return finalizeStructuralCommand(unnestVisualEditorNode(document, command.nodeId));
    case "remove-node":
      return finalizeStructuralCommand(removeVisualEditorNode(document, command.nodeId));
  }
}

function symbolInstanceCount(document: EditorDocument, symbolId: EditorSymbolId): number {
  return Object.values(document.nodes).filter((node) => node.symbolReference?.symbolId === symbolId).length;
}

/** Lists symbol definitions together with their active local instance counts. */
export function getVisualEditorSymbols(document: EditorDocument): VisualEditorSymbolOption[] {
  return Object.values(document.globals.symbols)
    .map((symbol) => {
      const root = document.nodes[symbol.rootNodeId];
      return root ? {
        id: symbol.id,
        name: symbol.name,
        rootNodeId: symbol.rootNodeId,
        type: root.type,
        instanceCount: symbolInstanceCount(document, symbol.id),
      } : undefined;
    })
    .filter((symbol): symbol is VisualEditorSymbolOption => Boolean(symbol));
}

export function getVisualEditorSymbolCreateBlocker(document: EditorDocument, nodeId: EditorNodeId): string | undefined {
  const node = document.nodes[nodeId];
  const location = getVisualEditorNodeLocation(document, nodeId);
  const definition = node ? getComponentDefinition(node.type) : undefined;
  if (!node || !location) return "Select an element from the page tree to make it reusable.";
  if (location.isPageRoot) return "A page root cannot be made reusable.";
  if (!definition) return "Legacy nodes without a registry definition cannot be made reusable.";
  if (definitionHasRequiredChildren(definition)) return "This layout needs required child elements and cannot be instantiated safely yet.";
  if (node.symbolReference) return "Detach this symbol instance before making it a new reusable component.";
  if (Object.values(document.globals.symbols).some((symbol) => symbol.rootNodeId === nodeId)) return "This element is already the source of a reusable component.";
  return undefined;
}

/** Registers a selected page-tree node as a reusable local symbol without moving the source. */
export function createVisualEditorSymbol(
  document: EditorDocument,
  nodeId: EditorNodeId,
  requestedName?: string,
): EditorDocument | undefined {
  const blocker = getVisualEditorSymbolCreateBlocker(document, nodeId);
  const node = document.nodes[nodeId];
  const definition = node ? getComponentDefinition(node.type) : undefined;
  if (blocker || !node || !definition) return undefined;
  const id = allocateSymbolId(document, node.type);
  const name = requestedName?.trim() || `${definition.label} symbol`;
  return {
    ...document,
    globals: {
      ...document.globals,
      symbols: {
        ...document.globals.symbols,
        [id]: { id, name, rootNodeId: nodeId },
      },
    },
  };
}

/** Returns symbols whose source type is legal in a selected parent slot. */
export function getVisualEditorInsertableSymbols(document: EditorDocument, target: VisualEditorInsertTarget): VisualEditorSymbolOption[] {
  const parent = document.nodes[target.parentId];
  if (!parent) return [];
  return getVisualEditorSymbols(document).filter((symbol) => {
    const source = document.nodes[symbol.rootNodeId];
    const definition = source ? getComponentDefinition(source.type) : undefined;
    return Boolean(source && definition && !definitionHasRequiredChildren(definition) && canContain(parent, target.slotName, definition));
  });
}

/** Inserts a shallow, independently valid instance that renders its shared symbol source. */
export function insertVisualEditorSymbol(
  document: EditorDocument,
  target: VisualEditorInsertTarget,
  symbolId: EditorSymbolId,
): VisualEditorStructureChange | undefined {
  const parent = document.nodes[target.parentId];
  const symbol = document.globals.symbols[symbolId];
  const source = symbol ? document.nodes[symbol.rootNodeId] : undefined;
  const definition = source ? getComponentDefinition(source.type) : undefined;
  if (!parent || !symbol || !source || !definition || definitionHasRequiredChildren(definition) || !canContain(parent, target.slotName, definition)) return undefined;

  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  const id = allocateNodeId(nodes, source.type);
  nodes[id] = {
    id,
    type: source.type,
    kind: definition.kind,
    props: structuredClone(source.props),
    ...(source.styles ? { styles: structuredClone(source.styles) } : {}),
    visibility: { base: true },
    slots: Object.fromEntries(Object.keys(definition.slots).map((slotName) => [slotName, { name: slotName, childIds: [] }])),
    ...(source.assetIds ? { assetIds: [...source.assetIds] } : {}),
    symbolReference: { symbolId },
  };
  nodes[parent.id].slots[target.slotName].childIds.push(id);
  return { document: { ...document, nodes }, nodeId: id };
}

export function renameVisualEditorSymbol(document: EditorDocument, symbolId: EditorSymbolId, name: string): EditorDocument | undefined {
  const symbol = document.globals.symbols[symbolId];
  const nextName = name.trim();
  if (!symbol || !nextName || nextName === symbol.name) return undefined;
  return {
    ...document,
    globals: {
      ...document.globals,
      symbols: { ...document.globals.symbols, [symbolId]: { ...symbol, name: nextName } },
    },
  };
}

export function getVisualEditorSymbolRemovalBlocker(document: EditorDocument, symbolId: EditorSymbolId): string | undefined {
  const symbol = document.globals.symbols[symbolId];
  if (!symbol) return "This reusable component no longer exists.";
  const count = symbolInstanceCount(document, symbolId);
  return count ? `Detach ${count} linked instance${count === 1 ? "" : "s"} before deleting this reusable component.` : undefined;
}

export function removeVisualEditorSymbol(document: EditorDocument, symbolId: EditorSymbolId): EditorDocument | undefined {
  if (getVisualEditorSymbolRemovalBlocker(document, symbolId)) return undefined;
  const symbols = structuredClone(document.globals.symbols);
  delete symbols[symbolId];
  return { ...document, globals: { ...document.globals, symbols } };
}

/** Makes one linked instance independent while retaining its current source-derived props and styles. */
export function unlinkVisualEditorSymbolInstance(document: EditorDocument, nodeId: EditorNodeId): EditorDocument | undefined {
  const node = document.nodes[nodeId];
  if (!node?.symbolReference) return undefined;
  const unlinkedNode = structuredClone(node);
  delete unlinkedNode.symbolReference;
  return {
    ...document,
    nodes: { ...document.nodes, [nodeId]: unlinkedNode },
  };
}
