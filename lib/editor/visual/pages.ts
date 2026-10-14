import type { EditorDocument, EditorNode, EditorNodeId, EditorPage, EditorPageId, EditorValue } from "@/lib/editor/document";

export interface VisualEditorPageChange {
  document: EditorDocument;
  pageId: EditorPageId;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
}

function allocateId(existing: Iterable<string>, base: string): string {
  const ids = new Set(existing);
  let index = 1;
  let candidate = `${base}-${index}`;
  while (ids.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

function allocatePageId(document: EditorDocument, name: string): EditorPageId {
  return allocateId(document.pages.map((page) => page.id), `page-${slugify(name)}`);
}

function allocateNodeId(nodes: Record<string, EditorNode>, type: string): EditorNodeId {
  return allocateId(Object.keys(nodes), `editor-${type.replace(/[^a-zA-Z0-9]+/g, "-")}`);
}

function allocatePagePath(document: EditorDocument, name: string): string {
  const base = `/${slugify(name)}`;
  const paths = new Set(document.pages.map((page) => page.path));
  if (!paths.has(base)) return base;
  let index = 2;
  let candidate = `${base}-${index}`;
  while (paths.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

function defaultPage(id: EditorPageId, name: string, path: string, rootNodeId: EditorNodeId, order: number): EditorPage {
  return {
    id,
    name,
    path,
    order,
    visibility: { base: true },
    seo: { title: name, description: "", keywords: [] },
    navigation: {
      includeInHeader: false,
      includeInFooter: false,
      includeInSidebar: false,
    },
    rootNodeIds: [rootNodeId],
  };
}

function collectSubtreeNodeIds(document: EditorDocument, nodeId: EditorNodeId, collected = new Set<EditorNodeId>()): Set<EditorNodeId> {
  if (collected.has(nodeId) || !document.nodes[nodeId]) return collected;
  collected.add(nodeId);
  Object.values(document.nodes[nodeId].slots).forEach((slot) => slot.childIds.forEach((childId) => collectSubtreeNodeIds(document, childId, collected)));
  return collected;
}

function pageNodeIds(document: EditorDocument, page: EditorPage): Set<EditorNodeId> {
  return page.rootNodeIds.reduce((ids, rootNodeId) => collectSubtreeNodeIds(document, rootNodeId, ids), new Set<EditorNodeId>());
}

function rewriteNodeTargets(value: EditorValue, copiedIds: Record<EditorNodeId, EditorNodeId>): EditorValue {
  if (Array.isArray(value)) return value.map((entry) => rewriteNodeTargets(entry, copiedIds));
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, EditorValue>;
  if (record.kind === "node" && typeof record.nodeId === "string" && copiedIds[record.nodeId]) {
    return { ...record, nodeId: copiedIds[record.nodeId] };
  }
  return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, rewriteNodeTargets(entry, copiedIds)]));
}

function navigationTargetsPage(items: EditorDocument["navigation"]["menus"][number]["items"], pageId: EditorPageId): boolean {
  return items.some((item) => (item.target.kind === "page" && item.target.pageId === pageId) || navigationTargetsPage(item.children, pageId));
}

function navigationTargetsNode(items: EditorDocument["navigation"]["menus"][number]["items"], nodeIds: Set<EditorNodeId>): boolean {
  return items.some((item) => (item.target.kind === "node" && nodeIds.has(item.target.nodeId)) || navigationTargetsNode(item.children, nodeIds));
}

function containsTarget(value: unknown, kind: "node" | "page", id: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => containsTarget(entry, kind, id));
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.kind === kind && (kind === "node" ? record.nodeId : record.pageId) === id) return true;
  return Object.values(record).some((entry) => containsTarget(entry, kind, id));
}

function reindexPages(pages: EditorPage[]): EditorPage[] {
  return pages.map((page, order) => ({ ...page, order }));
}

/** Creates an empty page with a fresh page-root node and a unique draft path. */
export function createVisualEditorPage(document: EditorDocument, requestedName?: string): VisualEditorPageChange {
  const name = requestedName?.trim() || "New page";
  const id = allocatePageId(document, name);
  const rootNodeId = allocateNodeId(document.nodes, "layout.page-root");
  const page = defaultPage(id, name, allocatePagePath(document, name), rootNodeId, document.pages.length);
  const root: EditorNode = {
    id: rootNodeId,
    type: "layout.page-root",
    kind: "container",
    props: {},
    visibility: { base: true },
    slots: { default: { name: "default", childIds: [] } },
  };
  return { document: { ...document, pages: [...document.pages, page], nodes: { ...document.nodes, [rootNodeId]: root } }, pageId: id };
}

/** Clones a page-owned subtree with fresh node identities and remapped internal node links. */
export function duplicateVisualEditorPage(document: EditorDocument, pageId: EditorPageId): VisualEditorPageChange | undefined {
  const sourcePage = document.pages.find((page) => page.id === pageId);
  if (!sourcePage) return undefined;
  const sourceNodeIds = [...pageNodeIds(document, sourcePage)];
  if (!sourceNodeIds.length || sourceNodeIds.some((nodeId) => !document.nodes[nodeId])) return undefined;
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  const copiedIds = sourceNodeIds.reduce<Record<EditorNodeId, EditorNodeId>>((result, sourceNodeId) => {
    result[sourceNodeId] = allocateNodeId(nodes, document.nodes[sourceNodeId].type);
    nodes[result[sourceNodeId]] = { ...document.nodes[sourceNodeId], id: result[sourceNodeId], slots: {} };
    return result;
  }, {});
  sourceNodeIds.forEach((sourceNodeId) => {
    const source = document.nodes[sourceNodeId];
    const copyId = copiedIds[sourceNodeId];
    nodes[copyId] = {
      ...structuredClone(source),
      id: copyId,
      props: rewriteNodeTargets(source.props, copiedIds) as typeof source.props,
      slots: Object.fromEntries(Object.entries(source.slots).map(([slotName, slot]) => [
        slotName,
        { name: slot.name, childIds: slot.childIds.map((childId) => copiedIds[childId] ?? childId) },
      ])),
    };
  });
  const name = `${sourcePage.name} copy`;
  const id = allocatePageId(document, name);
  const path = allocatePagePath(document, `${sourcePage.name}-copy`);
  const page: EditorPage = {
    ...structuredClone(sourcePage),
    id,
    name,
    path,
    order: sourcePage.order + 1,
    rootNodeIds: sourcePage.rootNodeIds.map((rootNodeId) => copiedIds[rootNodeId]),
  };
  const index = document.pages.findIndex((candidate) => candidate.id === sourcePage.id);
  const pages = reindexPages([...document.pages.slice(0, index + 1), page, ...document.pages.slice(index + 1)]);
  return { document: { ...document, pages, nodes }, pageId: id };
}

export function getVisualEditorPageRemovalBlocker(document: EditorDocument, pageId: EditorPageId): string | undefined {
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page) return "This page no longer exists.";
  if (document.pages.length <= 1) return "A site must keep at least one page.";
  const removedNodeIds = pageNodeIds(document, page);
  if (document.navigation.activePageId === pageId) return "Choose another active page before deleting this page.";
  if (document.navigation.menus.some((menu) => navigationTargetsPage(menu.items, pageId))) return "Update navigation links to this page before deleting it.";
  if (document.navigation.menus.some((menu) => navigationTargetsNode(menu.items, removedNodeIds))) return "Update navigation links to this page's content before deleting it.";
  if (document.pages.some((candidate) => candidate.id !== pageId && candidate.navigation.parentPageId === pageId)) return "Move or update child pages before deleting this page.";
  if (document.pages.some((candidate) => candidate.id !== pageId && candidate.rootNodeIds.some((rootNodeId) => removedNodeIds.has(rootNodeId)))) return "Another page shares this page's root node.";
  if ([document.globals.header?.nodeId, document.globals.footer?.nodeId].some((nodeId) => nodeId && removedNodeIds.has(nodeId))) return "This page contains a global component.";
  if (Object.values(document.globals.symbols).some((symbol) => removedNodeIds.has(symbol.rootNodeId))) return "This page contains a reusable component source.";
  if (Object.entries(document.nodes).some(([nodeId, node]) => !removedNodeIds.has(nodeId) && (
    [...removedNodeIds].some((removedNodeId) => containsTarget(node.props, "node", removedNodeId)) || containsTarget(node.props, "page", pageId)
  ))) return "Update links to this page or its content before deleting it.";
  return undefined;
}

/** Deletes a complete page subtree only when it has no page, node, global, symbol, or navigation references. */
export function removeVisualEditorPage(document: EditorDocument, pageId: EditorPageId): EditorDocument | undefined {
  if (getVisualEditorPageRemovalBlocker(document, pageId)) return undefined;
  const page = document.pages.find((candidate) => candidate.id === pageId);
  if (!page) return undefined;
  const removedNodeIds = pageNodeIds(document, page);
  const nodes = structuredClone(document.nodes) as Record<string, EditorNode>;
  removedNodeIds.forEach((nodeId) => delete nodes[nodeId]);
  return { ...document, pages: reindexPages(document.pages.filter((candidate) => candidate.id !== pageId)), nodes };
}

export function renameVisualEditorPage(document: EditorDocument, pageId: EditorPageId, name: string): EditorDocument | undefined {
  const nextName = name.trim();
  if (!nextName || !document.pages.some((page) => page.id === pageId)) return undefined;
  return { ...document, pages: document.pages.map((page) => page.id === pageId ? { ...page, name: nextName } : page) };
}

export function updateVisualEditorPagePath(document: EditorDocument, pageId: EditorPageId, path: string): EditorDocument | undefined {
  const nextPath = path.trim();
  if (!nextPath.startsWith("/") || document.pages.some((page) => page.id !== pageId && page.path === nextPath)) return undefined;
  if (!document.pages.some((page) => page.id === pageId)) return undefined;
  return { ...document, pages: document.pages.map((page) => page.id === pageId ? { ...page, path: nextPath } : page) };
}

export function moveVisualEditorPage(document: EditorDocument, pageId: EditorPageId, direction: "up" | "down"): EditorDocument | undefined {
  const index = document.pages.findIndex((page) => page.id === pageId);
  const nextIndex = index + (direction === "up" ? -1 : 1);
  if (index < 0 || nextIndex < 0 || nextIndex >= document.pages.length) return undefined;
  const pages = [...document.pages];
  [pages[index], pages[nextIndex]] = [pages[nextIndex], pages[index]];
  return { ...document, pages: reindexPages(pages) };
}
