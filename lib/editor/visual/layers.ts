import type { EditorDocument, EditorNode, EditorNodeId, EditorPageId } from "@/lib/editor/document";
import { getComponentDefinition } from "@/lib/editor/registry";

export interface VisualEditorLayerNode {
  id: EditorNodeId;
  label: string;
  type: string;
  hidden: boolean;
  unsupported: boolean;
  children: VisualEditorLayerNode[];
}

function layerLabel(node: EditorNode): string {
  const definition = getComponentDefinition(node.type);
  if (definition) return definition.label;
  if (node.legacy?.unsupported) return `Unsupported legacy: ${node.legacy.sourceType}`;
  return node.legacy?.sourceType ? `Legacy: ${node.legacy.sourceType}` : "Unsupported node";
}

function buildNode(document: EditorDocument, nodeId: EditorNodeId, seen = new Set<string>()): VisualEditorLayerNode | undefined {
  const node = document.nodes[nodeId];
  if (!node || seen.has(nodeId)) return undefined;
  const nextSeen = new Set(seen);
  nextSeen.add(nodeId);
  return {
    id: node.id,
    label: layerLabel(node),
    type: node.type,
    hidden: node.visibility.base === false,
    unsupported: Boolean(node.legacy?.unsupported),
    children: Object.values(node.slots).flatMap((slot) =>
      slot.childIds.flatMap((childId) => {
        const child = buildNode(document, childId, nextSeen);
        return child ? [child] : [];
      }),
    ),
  };
}

export function getVisualEditorPageLayers(document: EditorDocument, pageId: EditorPageId): VisualEditorLayerNode[] {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page) return [];
  return page.rootNodeIds.flatMap((nodeId) => {
    const layer = buildNode(document, nodeId);
    return layer ? [layer] : [];
  });
}

export function getVisualEditorGlobalLayers(document: EditorDocument): VisualEditorLayerNode[] {
  return [document.globals.header?.nodeId, document.globals.footer?.nodeId].flatMap((nodeId) => {
    if (!nodeId) return [];
    const layer = buildNode(document, nodeId);
    return layer ? [layer] : [];
  });
}

export function findVisualEditorNodePageId(document: EditorDocument, nodeId: EditorNodeId): EditorPageId | undefined {
  return document.pages.find((page) => {
    const visit = (candidateId: EditorNodeId, visited = new Set<string>()): boolean => {
      if (candidateId === nodeId || visited.has(candidateId)) return candidateId === nodeId;
      visited.add(candidateId);
      return Object.values(document.nodes[candidateId]?.slots ?? {}).some((slot) => slot.childIds.some((childId) => visit(childId, visited)));
    };
    return page.rootNodeIds.some((rootId) => visit(rootId));
  })?.id;
}
