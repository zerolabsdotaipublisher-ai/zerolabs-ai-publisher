import { routes as appRoutes } from "@/config/routes";
import type { WebsitePage, WebsiteStructure } from "@/lib/ai/structure";
import { getWebsiteRoutingConfig } from "@/lib/routing";
import type {
  NextStaticPageParams,
  StaticPageRoute,
  StaticSiteData,
  StaticValidationIssue,
} from "./types";

const staticSlugPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

function normalizeStaticPath(slug: string): string {
  if (!slug || slug === "home" || slug === "/") {
    return "/";
  }

  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/g, "") : normalized;
}

function pathToSegments(path: string): string[] | undefined {
  if (path === "/") {
    return undefined;
  }

  return trimSlashes(path).split("/").filter(Boolean);
}

function pageDataPath(structureId: string, path: string): string {
  const leafPath = path === "/" ? "index" : trimSlashes(path).replace(/\//g, "__");
  return `data/${structureId}/pages/${leafPath}.json`;
}

function pageOutputPath(path: string): string {
  if (path === "/") {
    return "pages/index.html";
  }

  return `pages/${trimSlashes(path)}/index.html`;
}

export function createStaticPageRoute(
  structure: Pick<WebsiteStructure, "id">,
  page: Pick<WebsitePage, "id" | "slug" | "title" | "visible" | "order">,
): StaticPageRoute {
  const path = normalizeStaticPath(page.slug);
  const slug = path;
  const nextParams: NextStaticPageParams = {
    id: structure.id,
    slug: pathToSegments(path),
  };

  return {
    kind: "page",
    structureId: structure.id,
    pageId: page.id,
    slug,
    path,
    outputPath: pageOutputPath(path),
    dataPath: pageDataPath(structure.id, path),
    title: page.title,
    visible: page.visible !== false,
    order: page.order,
    nextParams,
  };
}

export function createStaticPageRoutes(structure: WebsiteStructure): StaticPageRoute[] {
  const pagesById = new Map(structure.pages.map((page) => [page.id, page]));
  return getWebsiteRoutingConfig(structure).routes
    .filter((route) => route.visible)
    .map((route) => {
      const page = pagesById.get(route.pageId);
      if (!page) {
        return undefined;
      }

      return createStaticPageRoute(structure, { ...page, slug: route.path });
    })
    .filter((route): route is StaticPageRoute => Boolean(route))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function createStaticRouteValidationIssues(
  structure: WebsiteStructure,
  routes: StaticPageRoute[],
): StaticValidationIssue[] {
  const issues: StaticValidationIssue[] = [];
  const visiblePages = structure.pages.filter((page) => page.visible !== false);
  const routesByPageId = new Map(routes.map((route) => [route.pageId, route]));
  const seenPaths = new Map<string, StaticPageRoute>();

  for (const route of routes) {
    if (!staticSlugPattern.test(route.path)) {
      issues.push({
        code: "invalid_route",
        severity: "error",
        pageId: route.pageId,
        routePath: route.path,
        message: `Static route "${route.path}" is not a valid static page path.`,
      });
    }

    const existingRoute = seenPaths.get(route.path);
    if (existingRoute) {
      issues.push({
        code: "duplicate_route",
        severity: "error",
        pageId: route.pageId,
        routePath: route.path,
        message: `Static route "${route.path}" is duplicated by pages "${existingRoute.pageId}" and "${route.pageId}".`,
      });
    }
    seenPaths.set(route.path, route);
  }

  for (const page of visiblePages) {
    if (!routesByPageId.has(page.id)) {
      issues.push({
        code: "missing_route",
        severity: "error",
        pageId: page.id,
        routePath: normalizeStaticPath(page.slug),
        message: `Visible page "${page.title}" is missing from the static route manifest.`,
      });
    }
  }

  return issues;
}

export function createNextStaticParamsFromRoutes(
  routes: StaticPageRoute[],
): NextStaticPageParams[] {
  return routes.map((route) => route.nextParams);
}

export function createNextStaticParamsFromSites(
  sites: StaticSiteData[],
): NextStaticPageParams[] {
  return sites.flatMap((site) => createNextStaticParamsFromRoutes(site.routes));
}

export function createGeneratedSiteRoutePath(structureId: string, path: string): string {
  const basePath = appRoutes.generatedSite(structureId);
  if (path === "/") {
    return basePath;
  }

  return `${basePath}/${trimSlashes(path)}`;
}

export function createPreviewRoutePath(structureId: string, path: string): string {
  const basePath = appRoutes.previewSite(structureId);
  if (path === "/") {
    return basePath;
  }

  return `${basePath}?page=${encodeURIComponent(path)}`;
}
