import {
  validateEditorDocument,
  type DocumentOpenGraph,
  type EditorDocument,
  type EditorNavigationItem,
  type EditorNavigationTarget,
  type EditorNodeId,
  type EditorPageId,
  type EditorValue,
  type NodeStyleTokens,
} from "@/lib/editor/document";
import {
  createVisualEditorSymbol,
  executeVisualEditorStructuralCommand,
  getVisualEditorNodeLocation,
  insertVisualEditorSymbol,
  removeVisualEditorSymbol,
  renameVisualEditorSymbol,
  unlinkVisualEditorSymbolInstance,
  type VisualEditorInsertTarget,
} from "./structure";
import { addVisualEditorNavigationItem, removeVisualEditorNavigationItem } from "./navigation";
import {
  createVisualEditorPage,
  duplicateVisualEditorPage,
  moveVisualEditorPage,
  removeVisualEditorPage,
  renameVisualEditorPage,
  updateVisualEditorPagePath,
} from "./pages";

export const VISUAL_EDITOR_HISTORY_LIMIT = 80;
export const VISUAL_EDITOR_PERSISTENCE_ENABLED = false;

export type VisualEditorViewport = "desktop" | "tablet" | "mobile";
/**
 * Inspector groups deliberately mirror registry metadata.  `actions` is
 * labelled "Link / Action" in the UI so destinations never get mixed into
 * content fields.
 */
export type VisualEditorPanelTab = "content" | "layout" | "style" | "typography" | "effects" | "visibility" | "actions";
export type VisualEditorSelectionScope = "site" | "page" | "node";

export interface VisualEditorState {
  document: EditorDocument;
  selectedPageId: EditorPageId;
  selectedNodeId?: EditorNodeId;
  selectedScope: VisualEditorSelectionScope;
  hoveredNodeId?: EditorNodeId;
  activeViewport: VisualEditorViewport;
  panelTab: VisualEditorPanelTab;
  previewMode: boolean;
  expandedNodeIds: string[];
  undoStack: EditorDocument[];
  redoStack: EditorDocument[];
  dirty: boolean;
}

export type VisualEditorAction =
  | { type: "select-site" }
  | { type: "select-page"; pageId: EditorPageId }
  | { type: "select-node"; nodeId: EditorNodeId; pageId?: EditorPageId }
  | { type: "clear-node-selection" }
  | { type: "hover-node"; nodeId?: EditorNodeId }
  | { type: "set-viewport"; viewport: VisualEditorViewport }
  | { type: "set-panel-tab"; tab: VisualEditorPanelTab }
  | { type: "toggle-preview" }
  | { type: "toggle-node-expanded"; nodeId: EditorNodeId }
  | { type: "update-node-prop"; nodeId: EditorNodeId; path: string; value: EditorValue }
  | { type: "update-node-style"; nodeId: EditorNodeId; key: keyof NodeStyleTokens; value: EditorValue | undefined }
  | { type: "update-node-visibility"; nodeId: EditorNodeId; breakpoint: "base" | "desktop" | "tablet" | "mobile"; value: boolean | undefined }
  | { type: "add-page" }
  | { type: "duplicate-page"; pageId: EditorPageId }
  | { type: "remove-page"; pageId: EditorPageId }
  | { type: "move-page"; pageId: EditorPageId; direction: "up" | "down" }
  | { type: "update-page"; pageId: EditorPageId; path: string; value: EditorValue }
  | { type: "update-site"; path: string; value: EditorValue | undefined }
  | { type: "update-navigation-item"; menuId: string; itemId: string; patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target" | "variant">> }
  | { type: "add-navigation-item"; menuId: string; parentItemId?: string }
  | { type: "remove-navigation-item"; menuId: string; itemId: string }
  | { type: "move-navigation-item"; menuId: string; itemId: string; direction: "up" | "down" }
  | { type: "insert-node"; target: VisualEditorInsertTarget; nodeType: string }
  | { type: "duplicate-node"; nodeId: EditorNodeId }
  | { type: "move-node"; nodeId: EditorNodeId; direction: "up" | "down" }
  | { type: "nest-node"; nodeId: EditorNodeId }
  | { type: "unnest-node"; nodeId: EditorNodeId }
  | { type: "remove-node"; nodeId: EditorNodeId }
  | { type: "create-symbol"; nodeId: EditorNodeId; name?: string }
  | { type: "insert-symbol"; target: VisualEditorInsertTarget; symbolId: string }
  | { type: "rename-symbol"; symbolId: string; name: string }
  | { type: "remove-symbol"; symbolId: string }
  | { type: "unlink-symbol-instance"; nodeId: EditorNodeId }
  | { type: "undo" }
  | { type: "redo" };

function equalJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function setPath<T extends Record<string, unknown>>(source: T, path: string, value: EditorValue | undefined): T {
  const keys = path.split(".").filter(Boolean);
  if (!keys.length) return source;
  const root = structuredClone(source) as Record<string, unknown>;
  let cursor = root;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      if (value === undefined) delete cursor[key];
      else cursor[key] = value;
      return;
    }
    const next = cursor[key];
    cursor[key] = next && typeof next === "object" && !Array.isArray(next) ? { ...(next as Record<string, unknown>) } : {};
    cursor = cursor[key] as Record<string, unknown>;
  });
  return root as T;
}

function updateMenuItems(
  items: EditorNavigationItem[],
  itemId: string,
  patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target" | "variant">>,
): EditorNavigationItem[] {
  return items.map((item) => ({
    ...item,
    ...(item.id === itemId ? patch : {}),
    children: updateMenuItems(item.children, itemId, patch),
  }));
}

function moveMenuItem(
  items: EditorNavigationItem[],
  itemId: string,
  direction: "up" | "down",
): EditorNavigationItem[] {
  const index = items.findIndex((item) => item.id === itemId);
  if (index >= 0) {
    const adjacentIndex = index + (direction === "up" ? -1 : 1);
    if (adjacentIndex < 0 || adjacentIndex >= items.length) return items;
    const next = [...items];
    [next[index], next[adjacentIndex]] = [next[adjacentIndex], next[index]];
    return next;
  }
  let changed = false;
  const nested = items.map((item) => {
    const children = moveMenuItem(item.children, itemId, direction);
    if (children === item.children) return item;
    changed = true;
    return { ...item, children };
  });
  return changed ? nested : items;
}

function replaceDocument(state: VisualEditorState, document: EditorDocument): VisualEditorState {
  if (equalJson(state.document, document)) return state;
  return {
    ...state,
    document,
    undoStack: [...state.undoStack, state.document].slice(-VISUAL_EDITOR_HISTORY_LIMIT),
    redoStack: [],
    dirty: true,
  };
}

function selectionForDocument(
  state: VisualEditorState,
  document: EditorDocument,
  preference: { nodeId?: EditorNodeId | null; pageId?: EditorPageId } = {},
): Pick<VisualEditorState, "selectedPageId" | "selectedNodeId" | "selectedScope" | "hoveredNodeId"> {
  const selectedPageId = preference.pageId && document.pages.some((page) => page.id === preference.pageId)
    ? preference.pageId
    : document.pages.some((page) => page.id === state.selectedPageId)
      ? state.selectedPageId
      : document.pages[0]!.id;
  const candidateNodeId = preference.nodeId === null ? undefined : preference.nodeId ?? state.selectedNodeId;
  const selectedNodeId = candidateNodeId && document.nodes[candidateNodeId] ? candidateNodeId : undefined;
  const hoveredNodeId = state.hoveredNodeId && document.nodes[state.hoveredNodeId] ? state.hoveredNodeId : undefined;
  return {
    selectedPageId,
    selectedNodeId,
    selectedScope: selectedNodeId ? "node" : state.selectedScope === "site" ? "site" : "page",
    hoveredNodeId,
  };
}

function updatePageOpenGraph(page: EditorDocument["pages"][number], path: string, value: EditorValue): EditorDocument["pages"][number] | undefined {
  const field = path.slice("seo.openGraph.".length);
  const base: DocumentOpenGraph = page.seo.openGraph ?? {
    title: page.seo.title,
    description: page.seo.description,
    type: "website",
    url: page.seo.canonicalUrl ?? page.path,
  };
  if (field === "type") {
    if (value !== "website" && value !== "article") return undefined;
    return { ...page, seo: { ...page.seo, openGraph: { ...base, type: value } } };
  }
  if (!["title", "description", "url", "image"].includes(field) || typeof value !== "string") return undefined;
  return { ...page, seo: { ...page.seo, openGraph: { ...base, [field]: value } } };
}

export function createVisualEditorState(document: EditorDocument, selectedPageId?: EditorPageId): VisualEditorState {
  const pageId = selectedPageId && document.pages.some((page) => page.id === selectedPageId)
    ? selectedPageId
    : document.pages[0]?.id;
  if (!pageId) throw new Error("An EditorDocument requires a page before it can be opened in the visual editor.");

  return {
    document: structuredClone(document),
    selectedPageId: pageId,
    selectedScope: "page",
    activeViewport: "desktop",
    panelTab: "content",
    previewMode: false,
    expandedNodeIds: document.pages.flatMap((page) => page.rootNodeIds),
    undoStack: [],
    redoStack: [],
    dirty: false,
  };
}

export function getVisualEditorSaveState(state: VisualEditorState): { disabled: boolean; label: string; message: string } {
  return {
    disabled: !VISUAL_EDITOR_PERSISTENCE_ENABLED,
    label: VISUAL_EDITOR_PERSISTENCE_ENABLED ? "Save draft" : "Save disabled",
    message: state.dirty
      ? "Draft changes are local to this browser session until the atomic save safety gate is complete."
      : "Draft-only mode. Saving is unavailable until the atomic save safety gate is complete.",
  };
}

export function visualEditorReducer(state: VisualEditorState, action: VisualEditorAction): VisualEditorState {
  switch (action.type) {
    case "select-site":
      return { ...state, selectedScope: "site", selectedNodeId: undefined, panelTab: "style" };
    case "select-page":
      return { ...state, selectedPageId: action.pageId, selectedScope: "page", selectedNodeId: undefined };
    case "select-node":
      if (!state.document.nodes[action.nodeId]) return state;
      return {
        ...state,
        ...(action.pageId ? { selectedPageId: action.pageId } : {}),
        selectedScope: "node",
        selectedNodeId: action.nodeId,
      };
    case "clear-node-selection":
      return { ...state, selectedScope: "page", selectedNodeId: undefined };
    case "hover-node":
      if (action.nodeId && !state.document.nodes[action.nodeId]) return state;
      return state.hoveredNodeId === action.nodeId ? state : { ...state, ...(action.nodeId ? { hoveredNodeId: action.nodeId } : { hoveredNodeId: undefined }) };
    case "set-viewport":
      return { ...state, activeViewport: action.viewport };
    case "set-panel-tab":
      return { ...state, panelTab: action.tab };
    case "toggle-preview":
      return { ...state, previewMode: !state.previewMode, hoveredNodeId: undefined };
    case "toggle-node-expanded": {
      const expanded = state.expandedNodeIds.includes(action.nodeId);
      return {
        ...state,
        expandedNodeIds: expanded
          ? state.expandedNodeIds.filter((nodeId) => nodeId !== action.nodeId)
          : [...state.expandedNodeIds, action.nodeId],
      };
    }
    case "update-node-prop": {
      const node = state.document.nodes[action.nodeId];
      if (!node) return state;
      return replaceDocument(state, {
        ...state.document,
        nodes: {
          ...state.document.nodes,
          [node.id]: { ...node, props: setPath(node.props, action.path, action.value) },
        },
      });
    }
    case "update-node-style": {
      const node = state.document.nodes[action.nodeId];
      if (!node) return state;
      const styles = { ...node.styles } as Record<string, EditorValue | undefined>;
      if (action.value === undefined) delete styles[action.key];
      else styles[action.key] = action.value;
      return replaceDocument(state, {
        ...state.document,
        nodes: {
          ...state.document.nodes,
          [node.id]: { ...node, styles: styles as NodeStyleTokens },
        },
      });
    }
    case "update-node-visibility": {
      const node = state.document.nodes[action.nodeId];
      if (!node) return state;
      const visibility = { ...node.visibility };
      if (action.value === undefined && action.breakpoint !== "base") delete visibility[action.breakpoint];
      else if (action.value !== undefined) visibility[action.breakpoint] = action.value;
      return replaceDocument(state, {
        ...state.document,
        nodes: { ...state.document.nodes, [node.id]: { ...node, visibility } },
      });
    }
    case "add-page": {
      const change = createVisualEditorPage(state.document);
      const next = replaceDocument(state, change.document);
      return { ...next, ...selectionForDocument(next, change.document, { nodeId: null, pageId: change.pageId }) };
    }
    case "duplicate-page": {
      const change = duplicateVisualEditorPage(state.document, action.pageId);
      if (!change) return state;
      const next = replaceDocument(state, change.document);
      return { ...next, ...selectionForDocument(next, change.document, { nodeId: null, pageId: change.pageId }) };
    }
    case "remove-page": {
      const index = state.document.pages.findIndex((page) => page.id === action.pageId);
      const document = removeVisualEditorPage(state.document, action.pageId);
      if (!document) return state;
      const fallbackPageId = document.pages[Math.min(Math.max(index, 0), document.pages.length - 1)]?.id;
      const next = replaceDocument(state, document);
      return { ...next, ...selectionForDocument(next, document, { nodeId: null, pageId: fallbackPageId }) };
    }
    case "move-page": {
      const document = moveVisualEditorPage(state.document, action.pageId, action.direction);
      return document ? replaceDocument(state, document) : state;
    }
    case "update-page": {
      const page = state.document.pages.find((candidate) => candidate.id === action.pageId);
      if (!page) return state;
      if (action.path === "name" && typeof action.value === "string") {
        const document = renameVisualEditorPage(state.document, action.pageId, action.value);
        return document ? replaceDocument(state, document) : state;
      }
      if (action.path === "path" && typeof action.value === "string") {
        const document = updateVisualEditorPagePath(state.document, action.pageId, action.value);
        return document ? replaceDocument(state, document) : state;
      }
      if (action.path.startsWith("seo.openGraph.")) {
        const nextPage = updatePageOpenGraph(page, action.path, action.value);
        return nextPage ? replaceDocument(state, {
          ...state.document,
          pages: state.document.pages.map((candidate) => candidate.id === action.pageId ? nextPage : candidate),
        }) : state;
      }
      return replaceDocument(state, {
        ...state.document,
        pages: state.document.pages.map((candidate) =>
          candidate.id === action.pageId ? setPath(candidate as unknown as Record<string, unknown>, action.path, action.value) : candidate,
        ) as EditorDocument["pages"],
      });
    }
    case "update-site": {
      const headerId = state.document.globals.header?.nodeId;
      const header = headerId ? state.document.nodes[headerId] : undefined;
      const mirrorsHeaderIdentity = (action.path === "name" || action.path === "tagline") && header;
      return replaceDocument(state, {
        ...state.document,
        site: setPath(state.document.site as unknown as Record<string, unknown>, action.path, action.value) as unknown as EditorDocument["site"],
        ...(mirrorsHeaderIdentity && header && action.value !== undefined
          ? {
              nodes: {
                ...state.document.nodes,
                [header.id]: {
                  ...header,
                  props: { ...header.props, [action.path === "name" ? "siteName" : "tagline"]: action.value },
                },
              },
            }
          : {}),
      });
    }
    case "update-navigation-item": {
      const document = {
        ...state.document,
        navigation: {
          ...state.document.navigation,
          menus: state.document.navigation.menus.map((menu) =>
            menu.id === action.menuId ? { ...menu, items: updateMenuItems(menu.items, action.itemId, action.patch) } : menu,
          ),
        },
      };
      return validateEditorDocument(document).length === 0 ? replaceDocument(state, document) : state;
    }
    case "add-navigation-item": {
      const document = addVisualEditorNavigationItem(state.document, action);
      return document ? replaceDocument(state, document) : state;
    }
    case "remove-navigation-item": {
      const document = removeVisualEditorNavigationItem(state.document, action.menuId, action.itemId);
      return document ? replaceDocument(state, document) : state;
    }
    case "move-navigation-item": {
      const document = {
        ...state.document,
        navigation: {
          ...state.document.navigation,
          menus: state.document.navigation.menus.map((menu) =>
            menu.id === action.menuId ? { ...menu, items: moveMenuItem(menu.items, action.itemId, action.direction) } : menu,
          ),
        },
      };
      return validateEditorDocument(document).length === 0 ? replaceDocument(state, document) : state;
    }
    case "insert-node": {
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result?.insertedNodeId) return state;
      const next = replaceDocument(state, result.document);
      return {
        ...next,
        selectedScope: "node",
        selectedNodeId: result.insertedNodeId,
        expandedNodeIds: next.expandedNodeIds.includes(action.target.parentId)
          ? next.expandedNodeIds
          : [...next.expandedNodeIds, action.target.parentId],
      };
    }
    case "duplicate-node": {
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result?.insertedNodeId) return state;
      const next = replaceDocument(state, result.document);
      return { ...next, selectedScope: "node", selectedNodeId: result.insertedNodeId };
    }
    case "move-node": {
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result) return state;
      const next = replaceDocument(state, result.document);
      return { ...next, ...selectionForDocument(next, result.document, { nodeId: action.nodeId }) };
    }
    case "nest-node": {
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result) return state;
      const next = replaceDocument(state, result.document);
      return { ...next, ...selectionForDocument(next, result.document, { nodeId: action.nodeId }) };
    }
    case "unnest-node": {
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result) return state;
      const next = replaceDocument(state, result.document);
      return { ...next, ...selectionForDocument(next, result.document, { nodeId: action.nodeId }) };
    }
    case "remove-node": {
      const location = getVisualEditorNodeLocation(state.document, action.nodeId);
      const result = executeVisualEditorStructuralCommand(state.document, action);
      if (!result) return state;
      const next = replaceDocument(state, result.document);
      return {
        ...next,
        ...selectionForDocument(next, result.document, { nodeId: location?.parentId ?? null, pageId: location?.pageId }),
        hoveredNodeId: undefined,
      };
    }
    case "create-symbol": {
      const document = createVisualEditorSymbol(state.document, action.nodeId, action.name);
      return document ? replaceDocument(state, document) : state;
    }
    case "insert-symbol": {
      const change = insertVisualEditorSymbol(state.document, action.target, action.symbolId);
      if (!change) return state;
      const next = replaceDocument(state, change.document);
      return {
        ...next,
        selectedScope: "node",
        selectedNodeId: change.nodeId,
        expandedNodeIds: next.expandedNodeIds.includes(action.target.parentId)
          ? next.expandedNodeIds
          : [...next.expandedNodeIds, action.target.parentId],
      };
    }
    case "rename-symbol": {
      const document = renameVisualEditorSymbol(state.document, action.symbolId, action.name);
      return document ? replaceDocument(state, document) : state;
    }
    case "remove-symbol": {
      const document = removeVisualEditorSymbol(state.document, action.symbolId);
      return document ? replaceDocument(state, document) : state;
    }
    case "unlink-symbol-instance": {
      const document = unlinkVisualEditorSymbolInstance(state.document, action.nodeId);
      return document ? replaceDocument(state, document) : state;
    }
    case "undo": {
      const previous = state.undoStack.at(-1);
      if (!previous) return state;
      return {
        ...state,
        document: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [state.document, ...state.redoStack].slice(0, VISUAL_EDITOR_HISTORY_LIMIT),
        dirty: state.undoStack.length > 1,
        ...selectionForDocument(state, previous),
      };
    }
    case "redo": {
      const next = state.redoStack[0];
      if (!next) return state;
      return {
        ...state,
        document: next,
        undoStack: [...state.undoStack, state.document].slice(-VISUAL_EDITOR_HISTORY_LIMIT),
        redoStack: state.redoStack.slice(1),
        dirty: true,
        ...selectionForDocument(state, next),
      };
    }
  }
}

export function navigationTargetFromExternal(url: string): EditorNavigationTarget {
  return { kind: "external", url };
}
