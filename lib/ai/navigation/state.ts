import type { NavigationMenuItem } from "./types";

export function normalizeNavigationPath(path: string): string {
  if (!path) return "/";
  const value = path.trim();
  if (value === "/") return "/";
  return value.replace(/\/+$/, "") || "/";
}

export function isNavigationItemActive(
  itemHref: string,
  activePath: string,
): boolean {
  const href = normalizeNavigationPath(itemHref);
  const path = normalizeNavigationPath(activePath);

  if (href === "/") {
    return path === "/";
  }

  return path === href || path.startsWith(`${href}/`);
}

export function annotateMenuActiveState(
  items: NavigationMenuItem[],
  activePath: string,
): NavigationMenuItem[] {
  return items.map((item) => ({
    ...item,
    metadata: {
      active: isNavigationItemActive(item.href, activePath),
    },
    children: item.children?.length
      ? annotateMenuActiveState(item.children, activePath)
      : item.children,
  })) as NavigationMenuItem[];
}
