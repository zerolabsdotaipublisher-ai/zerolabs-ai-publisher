import type { NavigationItem, WebsiteStructure } from "@/lib/ai/structure";

function normalizeNavigationItems(items: NavigationItem[], includeVisibility: Record<string, boolean>): NavigationItem[] {
  return items.filter((item) => includeVisibility[item.href] ?? true);
}

export function updateNavigationLabel(structure: WebsiteStructure, href: string, label: string): WebsiteStructure {
  const normalizedLabel = label.trim();
  return {
    ...structure,
    navigation: {
      ...structure.navigation,
      primary: structure.navigation.primary.map((item) =>
        item.href === href
          ? {
              ...item,
              label: normalizedLabel || item.label,
            }
          : item,
      ),
      footer: structure.navigation.footer?.map((item) =>
        item.href === href
          ? {
              ...item,
              label: normalizedLabel || item.label,
            }
          : item,
      ),
    },
    pages: structure.pages.map((page) => {
      if (page.slug !== href) {
        return page;
      }

      return {
        ...page,
        navigationLabel: normalizedLabel || page.navigationLabel,
      };
    }),
  };
}

export function reorderNavigation(structure: WebsiteStructure, orderedHrefs: string[], location: "primary" | "footer" = "primary"): WebsiteStructure {
  const source = location === "primary" ? structure.navigation.primary : structure.navigation.footer ?? [];
  const sourceByHref = new Map(source.map((item) => [item.href, item]));
  const next = orderedHrefs
    .map((href) => sourceByHref.get(href))
    .filter((item): item is NavigationItem => Boolean(item));

  return {
    ...structure,
    navigation: {
      ...structure.navigation,
      [location]: next,
    },
  };
}

export function setNavigationVisibility(structure: WebsiteStructure, visibilityByHref: Record<string, boolean>): WebsiteStructure {
  const primary = normalizeNavigationItems(structure.navigation.primary, visibilityByHref);
  const footer = structure.navigation.footer
    ? normalizeNavigationItems(structure.navigation.footer, visibilityByHref)
    : undefined;

  return {
    ...structure,
    navigation: {
      ...structure.navigation,
      primary,
      footer,
    },
    pages: structure.pages.map((page) => {
      const visible = visibilityByHref[page.slug];
      if (typeof visible !== "boolean") {
        return page;
      }

      return {
        ...page,
        visible,
      };
    }),
  };
}

export function setNavigationInclusion(
  structure: WebsiteStructure,
  location: "primary" | "footer",
  href: string,
  include: boolean,
): WebsiteStructure {
  const source = location === "primary" ? structure.navigation.primary : structure.navigation.footer ?? [];
  const exists = source.some((item) => item.href === href);

  if (include && !exists) {
    const page = structure.pages.find((candidate) => candidate.slug === href);
    const label = page?.navigationLabel || page?.title || href;
    const next = [...source, { href, label }];
    return {
      ...structure,
      navigation: {
        ...structure.navigation,
        [location]: next,
      },
    };
  }

  if (!include && exists) {
    const next = source.filter((item) => item.href !== href);
    return {
      ...structure,
      navigation: {
        ...structure.navigation,
        [location]: next,
      },
    };
  }

  return structure;
}
