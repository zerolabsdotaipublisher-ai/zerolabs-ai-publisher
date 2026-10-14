import type { EditorDocument, EditorNavigationItem, EditorNavigationTarget } from "@/lib/editor/document";

export interface VisualEditorNavigationItemInput {
  menuId: string;
  parentItemId?: string;
  label?: string;
  target?: EditorNavigationTarget;
}

function allItemIds(items: EditorNavigationItem[], ids = new Set<string>()): Set<string> {
  items.forEach((item) => {
    ids.add(item.id);
    allItemIds(item.children, ids);
  });
  return ids;
}

function itemIdBase(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `nav-${slug || "item"}`;
}

function allocateItemId(items: EditorNavigationItem[], label: string): string {
  const ids = allItemIds(items);
  const base = itemIdBase(label);
  let index = 1;
  let candidate = `${base}-${index}`;
  while (ids.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

function appendNestedItem(items: EditorNavigationItem[], parentItemId: string, nextItem: EditorNavigationItem): EditorNavigationItem[] | undefined {
  let found = false;
  const nextItems = items.map((item) => {
    if (item.id === parentItemId) {
      found = true;
      return { ...item, children: [...item.children, nextItem] };
    }
    const children = appendNestedItem(item.children, parentItemId, nextItem);
    if (!children) return item;
    found = true;
    return { ...item, children };
  });
  return found ? nextItems : undefined;
}

function removeNestedItem(items: EditorNavigationItem[], itemId: string): EditorNavigationItem[] | undefined {
  const directIndex = items.findIndex((item) => item.id === itemId);
  if (directIndex >= 0) return [...items.slice(0, directIndex), ...items.slice(directIndex + 1)];
  let found = false;
  const nextItems = items.map((item) => {
    const children = removeNestedItem(item.children, itemId);
    if (!children) return item;
    found = true;
    return { ...item, children };
  });
  return found ? nextItems : undefined;
}

/** Adds a unique draft-only navigation item at the menu root or beneath a selected item. */
export function addVisualEditorNavigationItem(
  document: EditorDocument,
  input: VisualEditorNavigationItemInput,
): EditorDocument | undefined {
  const menu = document.navigation.menus.find((candidate) => candidate.id === input.menuId);
  const firstPage = document.pages[0];
  if (!menu || !firstPage) return undefined;
  const label = input.label?.trim() || "New navigation item";
  const item: EditorNavigationItem = {
    id: allocateItemId(menu.items, label),
    label,
    target: input.target ?? { kind: "page", pageId: firstPage.id },
    visible: true,
    children: [],
  };
  const items = input.parentItemId
    ? appendNestedItem(menu.items, input.parentItemId, item)
    : [...menu.items, item];
  if (!items) return undefined;
  return {
    ...document,
    navigation: {
      ...document.navigation,
      menus: document.navigation.menus.map((candidate) => candidate.id === menu.id ? { ...candidate, items } : candidate),
    },
  };
}

/** Removes one item and its child subtree without changing unrelated menus. */
export function removeVisualEditorNavigationItem(
  document: EditorDocument,
  menuId: string,
  itemId: string,
): EditorDocument | undefined {
  const menu = document.navigation.menus.find((candidate) => candidate.id === menuId);
  const items = menu ? removeNestedItem(menu.items, itemId) : undefined;
  if (!menu || !items) return undefined;
  return {
    ...document,
    navigation: {
      ...document.navigation,
      menus: document.navigation.menus.map((candidate) => candidate.id === menu.id ? { ...candidate, items } : candidate),
    },
  };
}
