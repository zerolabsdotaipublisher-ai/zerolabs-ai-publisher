import { createDefaultPageSeeds } from "./defaults";
import { generatePageHierarchy } from "./hierarchy";
import { generateNavigationLabel } from "./labels";
import type { NavigationGenerationContext, WebsiteNavigation } from "./types";

export function createFallbackNavigation(
  websiteType: NavigationGenerationContext["websiteType"],
  siteTitle: string,
): WebsiteNavigation {
  const context: NavigationGenerationContext = {
    websiteType,
    siteTitle,
    pages: createDefaultPageSeeds(websiteType),
  };
  const hierarchy = generatePageHierarchy(context);
  const primary = hierarchy.nodes.map((node) => ({
    label: generateNavigationLabel({
      id: node.pageId,
      slug: node.path,
      title: node.pageType,
      type: node.pageType,
      order: node.order,
      visible: node.visible,
      parentPageId: node.parentPageId,
      priority: node.priority,
      includeInNavigation: node.navigation.includeInHeader,
    }),
    href: node.path,
    pageId: node.pageId,
  }));

  return {
    primary,
    footer: primary,
    menus: [
      {
        id: "menu_header",
        location: "header",
        style: "top-nav",
        items: primary.map((item, index) => ({
          id: `nav_${item.pageId ?? index}`,
          label: item.label,
          href: item.href,
          pageId: item.pageId,
          parentItemId: null,
          order: index,
          visible: true,
          children: [],
        })),
      },
      {
        id: "menu_footer",
        location: "footer",
        style: "footer-nav",
        items: primary.map((item, index) => ({
          id: `nav_footer_${item.pageId ?? index}`,
          label: item.label,
          href: item.href,
          pageId: item.pageId,
          parentItemId: null,
          order: index,
          visible: true,
          children: [],
        })),
      },
      {
        id: "menu_sidebar",
        location: "sidebar",
        style: "sidebar-nav",
        items: [],
      },
    ],
    hierarchy,
    activePath: "/",
  };
}
