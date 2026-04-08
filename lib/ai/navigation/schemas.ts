import type {
  NavigationMenu,
  NavigationMenuItem,
  PageHierarchyNode,
  WebsiteNavigation,
} from "./types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateHierarchyNode(node: Partial<PageHierarchyNode>, index: number): string[] {
  const errors: string[] = [];
  const label = `hierarchy.nodes[${index}]`;

  if (!isNonEmptyString(node.pageId)) errors.push(`${label}.pageId is required`);
  if (!isNonEmptyString(node.path)) errors.push(`${label}.path is required`);
  if (!isNonEmptyString(node.slug)) errors.push(`${label}.slug is required`);
  if (typeof node.order !== "number") errors.push(`${label}.order is required`);
  if (typeof node.depth !== "number" || node.depth < 0) {
    errors.push(`${label}.depth must be >= 0`);
  }

  return errors;
}

function validateMenuItem(item: Partial<NavigationMenuItem>, index: number, menuId: string): string[] {
  const errors: string[] = [];
  const label = `menus[${menuId}].items[${index}]`;

  if (!isNonEmptyString(item.id)) errors.push(`${label}.id is required`);
  if (!isNonEmptyString(item.label)) errors.push(`${label}.label is required`);
  if (!isNonEmptyString(item.href)) errors.push(`${label}.href is required`);
  if (typeof item.order !== "number") errors.push(`${label}.order is required`);

  return errors;
}

function validateMenu(menu: Partial<NavigationMenu>, index: number): string[] {
  const errors: string[] = [];
  const label = `menus[${index}]`;

  if (!isNonEmptyString(menu.id)) errors.push(`${label}.id is required`);
  if (!isNonEmptyString(menu.location)) errors.push(`${label}.location is required`);
  if (!isNonEmptyString(menu.style)) errors.push(`${label}.style is required`);

  menu.items?.forEach((item, itemIndex) => {
    errors.push(...validateMenuItem(item, itemIndex, menu.id ?? String(index)));
  });

  return errors;
}

export function validateWebsiteNavigation(navigation: Partial<WebsiteNavigation>): string[] {
  const errors: string[] = [];

  if (!navigation.hierarchy) {
    errors.push("hierarchy is required");
  } else {
    if (!Array.isArray(navigation.hierarchy.nodes) || navigation.hierarchy.nodes.length === 0) {
      errors.push("hierarchy.nodes must include at least one node");
    } else {
      navigation.hierarchy.nodes.forEach((node, index) => {
        errors.push(...validateHierarchyNode(node, index));
      });

      const seenPaths = new Set<string>();
      navigation.hierarchy.nodes.forEach((node) => {
        if (seenPaths.has(node.path)) {
          errors.push(`duplicate hierarchy path: ${node.path}`);
        }
        seenPaths.add(node.path);
      });
    }
  }

  if (!Array.isArray(navigation.menus) || navigation.menus.length === 0) {
    errors.push("menus must include at least one menu");
  } else {
    navigation.menus.forEach((menu, index) => {
      errors.push(...validateMenu(menu, index));
    });
  }

  if (!Array.isArray(navigation.primary) || navigation.primary.length === 0) {
    errors.push("primary navigation must include at least one item");
  }

  return errors;
}

export function isValidWebsiteNavigation(
  navigation: Partial<WebsiteNavigation>,
): navigation is WebsiteNavigation {
  return validateWebsiteNavigation(navigation).length === 0;
}
