import { config, routes } from "@/config";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { createRedirectsForRouteChanges } from "./redirects";
import { getReservedRoutePrefixes } from "./reserved";
import { createDeterministicPagePath } from "./slugs";
import { validateWebsiteRoutes } from "./validation";
import type { WebsiteRouteRecord, WebsiteRoutingConfig } from "./types";

function withLeadingSlash(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function dedupePath(path: string, used: Set<string>): string {
  if (!used.has(path)) {
    used.add(path);
    return path;
  }

  let index = 2;
  let next = `${path}-${index}`;
  while (used.has(next)) {
    index += 1;
    next = `${path}-${index}`;
  }
  used.add(next);
  return next;
}

function mapNavigationToResolvedSlugs(
  structure: WebsiteStructure,
  pathByPageId: Map<string, string>,
): WebsiteStructure {
  const resolveHref = (href: string, pageId?: string): string => {
    if (pageId && pathByPageId.has(pageId)) {
      return pathByPageId.get(pageId) ?? href;
    }

    if (!href.startsWith("/")) {
      return href;
    }

    return href;
  };

  return {
    ...structure,
    navigation: {
      ...structure.navigation,
      primary: structure.navigation.primary.map((item) => ({
        ...item,
        href: resolveHref(item.href, item.pageId),
      })),
      footer: structure.navigation.footer?.map((item) => ({
        ...item,
        href: resolveHref(item.href, item.pageId),
      })),
    },
  };
}

export function buildWebsiteRouting(structure: WebsiteStructure, now = new Date().toISOString()): {
  structure: WebsiteStructure;
  routing: WebsiteRoutingConfig;
  validationErrors: string[];
} {
  const pages = [...structure.pages].sort((a, b) => a.order - b.order);
  const homePageId =
    pages.find((page) => page.type === "home")?.id ??
    pages.find((page) => page.slug === "/")?.id ??
    pages.find((page) => page.order === 0)?.id ??
    pages[0]?.id;

  const pageById = new Map(pages.map((page) => [page.id, page]));
  const usedPaths = new Set<string>();
  const pathByPageId = new Map<string, string>();

  const resolvePath = (pageId: string, stack = new Set<string>()): string => {
    const existing = pathByPageId.get(pageId);
    if (existing) {
      return existing;
    }

    const page = pageById.get(pageId);
    if (!page) {
      return "/";
    }

    if (stack.has(pageId)) {
      const fallback = dedupePath(`/${page.id}`, usedPaths);
      pathByPageId.set(pageId, fallback);
      return fallback;
    }

    stack.add(pageId);
    const parentPath = page.parentPageId ? resolvePath(page.parentPageId, stack) : undefined;
    let path = createDeterministicPagePath({
      slug: page.slug,
      title: page.title,
      type: page.type,
      isHome: page.id === homePageId,
      parentPath,
    });

    path = dedupePath(withLeadingSlash(path), usedPaths);
    pathByPageId.set(pageId, path);
    stack.delete(pageId);
    return path;
  };

  pages.forEach((page) => {
    resolvePath(page.id);
  });

  const resolvedPages = pages.map((page) => ({
    ...page,
    // Page slug remains the single product-owned route path value used by renderer/navigation/SSG.
    slug: pathByPageId.get(page.id) ?? page.slug,
  }));

  const resolvedPathByPageId = new Map(resolvedPages.map((page) => [page.id, page.slug]));

  const routedStructure = mapNavigationToResolvedSlugs(
    {
      ...structure,
      pages: resolvedPages,
    },
    resolvedPathByPageId,
  );

  const routesList: WebsiteRouteRecord[] = resolvedPages
    .map((page) => ({
      kind: "page" as const,
      pageId: page.id,
      slug: page.slug,
      path: page.slug,
      title: page.title,
      visible: page.visible !== false,
      order: page.order,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const previousRoutes = structure.routing?.routes ?? [];
  const redirects = createRedirectsForRouteChanges({
    previousRoutes,
    nextRoutes: routesList,
    generatedAt: now,
  });

  const routing: WebsiteRoutingConfig = {
    version: 1,
    generatedAt: structure.routing?.generatedAt ?? now,
    updatedAt: now,
    routes: routesList,
    redirects: [...(structure.routing?.redirects ?? []), ...redirects],
    reservedPaths: getReservedRoutePrefixes(),
    urls: {
      previewBasePath: routes.previewSite(structure.id),
      previewBaseUrl: new URL(routes.previewSite(structure.id), config.app.url).toString(),
      liveBasePath: routes.liveSite(structure.id),
      liveBaseUrl: new URL(routes.liveSite(structure.id), config.app.url).toString(),
    },
  };

  const validation = validateWebsiteRoutes(routesList);

  return {
    structure: {
      ...routedStructure,
      routing,
    },
    routing,
    validationErrors: validation.errors,
  };
}
