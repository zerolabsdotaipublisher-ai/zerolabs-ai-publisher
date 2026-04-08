import { generateNavigationLabel } from "./labels";
import { generatePageHierarchy } from "./hierarchy";
import { orderPages } from "./ordering";
import { applyNavigationOverrides } from "./overrides";
import type {
  NavigationGenerationContext,
  NavigationGenerationResult,
  NavigationItem,
  NavigationMenu,
  NavigationMenuItem,
  NavigationOverrideInput,
  PageHierarchyNode,
  WebsiteNavigation,
} from "./types";
import { validateWebsiteNavigation } from "./schemas";
import { createFallbackNavigation } from "./fallback";

function toMenuItem(
  node: PageHierarchyNode,
  label: string,
): NavigationMenuItem {
  return {
    id: `nav_${node.pageId}`,
    label,
    href: node.path,
    pageId: node.pageId,
    parentItemId: node.parentPageId ? `nav_${node.parentPageId}` : null,
    order: node.order,
    visible: node.visible,
    children: [],
  };
}

function nestMenuItems(items: NavigationMenuItem[]): NavigationMenuItem[] {
  const byId = new Map(items.map((item) => [item.id, { ...item, children: [] as NavigationMenuItem[] }]));
  const roots: NavigationMenuItem[] = [];

  byId.forEach((item) => {
    if (item.parentItemId) {
      const parent = byId.get(item.parentItemId);
      if (parent) {
        parent.children?.push(item);
        return;
      }
    }
    roots.push(item);
  });

  const sortItems = (list: NavigationMenuItem[]) => {
    list.sort((a, b) => a.order - b.order);
    list.forEach((item) => {
      if (item.children?.length) {
        sortItems(item.children);
      }
    });
  };

  sortItems(roots);
  return roots;
}

function flattenMenuItems(items: NavigationMenuItem[]): NavigationItem[] {
  const flat: NavigationItem[] = [];
  const visit = (list: NavigationMenuItem[]) => {
    list.forEach((item) => {
      if (item.visible) {
        flat.push({ label: item.label, href: item.href, pageId: item.pageId });
      }
      if (item.children?.length) {
        visit(item.children);
      }
    });
  };
  visit(items);
  return flat;
}

function buildMenus(items: NavigationMenuItem[]): NavigationMenu[] {
  const nested = nestMenuItems(items);
  const headerItems = nested.filter((item) => item.visible);
  const footerItems = nested.filter((item) => item.visible);

  return [
    {
      id: "menu_header",
      location: "header",
      style: "top-nav",
      items: headerItems,
    },
    {
      id: "menu_footer",
      location: "footer",
      style: "footer-nav",
      items: footerItems,
    },
    {
      id: "menu_sidebar",
      location: "sidebar",
      style: "sidebar-nav",
      items: nested.filter((item) => (item.children?.length ?? 0) > 0),
    },
  ];
}

export function generateWebsiteNavigation(
  context: NavigationGenerationContext,
  overrides?: NavigationOverrideInput,
): WebsiteNavigation {
  const overriddenPages = applyNavigationOverrides(context.pages, overrides);
  const orderedPages = orderPages(overriddenPages);
  const hierarchy = generatePageHierarchy({ ...context, pages: orderedPages });

  const items = hierarchy.nodes.map((node) => {
    const page = orderedPages.find((candidate) => candidate.id === node.pageId);
    const label = generateNavigationLabel({
      id: node.pageId,
      slug: node.path,
      title: page?.title ?? node.path,
      type: node.pageType,
      order: node.order,
      visible: node.visible,
      parentPageId: node.parentPageId,
      priority: node.priority,
      includeInNavigation: node.navigation.includeInHeader,
      navigationLabel: page?.navigationLabel,
    });
    return toMenuItem(node, label);
  });

  const menus = buildMenus(items);
  const primary = flattenMenuItems(menus.find((menu) => menu.location === "header")?.items ?? []);
  const footer = flattenMenuItems(menus.find((menu) => menu.location === "footer")?.items ?? []);

  return {
    primary,
    footer,
    menus,
    hierarchy,
    activePath: "/",
  };
}

export function generateValidatedWebsiteNavigation(
  context: NavigationGenerationContext,
  overrides?: NavigationOverrideInput,
): NavigationGenerationResult {
  const navigation = generateWebsiteNavigation(context, overrides);
  const validationErrors = validateWebsiteNavigation(navigation);

  if (validationErrors.length === 0) {
    return {
      navigation,
      validationErrors,
      usedFallback: false,
    };
  }

  const fallback = createFallbackNavigation(context.websiteType, context.siteTitle);

  return {
    navigation: fallback,
    validationErrors,
    usedFallback: true,
  };
}
