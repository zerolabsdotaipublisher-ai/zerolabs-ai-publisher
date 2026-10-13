import type {
  EditorDocument,
  EditorNavigationItem,
  EditorNavigationTarget,
  EditorNodeId,
  EditorPageId,
  EditorValue,
  NodeStyleTokens,
} from "@/lib/editor/document";

export const VISUAL_EDITOR_HISTORY_LIMIT = 80;
export const VISUAL_EDITOR_PERSISTENCE_ENABLED = false;

export type VisualEditorViewport = "desktop" | "tablet" | "mobile";
export type VisualEditorPanelTab = "properties" | "content" | "layout" | "style" | "typography" | "visibility";
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
  | { type: "update-page"; pageId: EditorPageId; path: string; value: EditorValue }
  | { type: "update-site"; path: string; value: EditorValue }
  | { type: "update-navigation-item"; menuId: string; itemId: string; patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target">> }
  | { type: "undo" }
  | { type: "redo" };

function equalJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function setPath<T extends Record<string, unknown>>(source: T, path: string, value: EditorValue): T {
  const keys = path.split(".").filter(Boolean);
  if (!keys.length) return source;
  const root = structuredClone(source) as Record<string, unknown>;
  let cursor = root;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
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
  patch: Partial<Pick<EditorNavigationItem, "label" | "visible" | "target">>,
): EditorNavigationItem[] {
  return items.map((item) => ({
    ...item,
    ...(item.id === itemId ? patch : {}),
    children: updateMenuItems(item.children, itemId, patch),
  }));
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
    panelTab: "properties",
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
      return { ...state, selectedScope: "site", selectedNodeId: undefined };
    case "select-page":
      return { ...state, selectedPageId: action.pageId, selectedScope: "page", selectedNodeId: undefined };
    case "select-node":
      return {
        ...state,
        ...(action.pageId ? { selectedPageId: action.pageId } : {}),
        selectedScope: "node",
        selectedNodeId: action.nodeId,
      };
    case "clear-node-selection":
      return { ...state, selectedScope: "page", selectedNodeId: undefined };
    case "hover-node":
      return state.hoveredNodeId === action.nodeId ? state : { ...state, hoveredNodeId: action.nodeId };
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
    case "update-page": {
      const page = state.document.pages.find((candidate) => candidate.id === action.pageId);
      if (!page) return state;
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
        ...(mirrorsHeaderIdentity && header
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
    case "update-navigation-item":
      return replaceDocument(state, {
        ...state.document,
        navigation: {
          ...state.document.navigation,
          menus: state.document.navigation.menus.map((menu) =>
            menu.id === action.menuId ? { ...menu, items: updateMenuItems(menu.items, action.itemId, action.patch) } : menu,
          ),
        },
      });
    case "undo": {
      const previous = state.undoStack.at(-1);
      if (!previous) return state;
      return {
        ...state,
        document: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [state.document, ...state.redoStack].slice(0, VISUAL_EDITOR_HISTORY_LIMIT),
        dirty: state.undoStack.length > 1,
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
      };
    }
  }
}

export function navigationTargetFromExternal(url: string): EditorNavigationTarget {
  return { kind: "external", url };
}
