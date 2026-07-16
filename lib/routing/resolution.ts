import type { WebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteRouteRecord, WebsiteRouteResolutionResult, WebsiteRoutingConfig } from "./types";

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function resolveWebsiteRoute(config: WebsiteRoutingConfig | undefined, path: string): WebsiteRouteResolutionResult {
  if (!config) {
    return { kind: "not_found" };
  }

  const normalizedPath = normalizePath(path);
  const routes = Array.isArray(config.routes) ? config.routes : [];
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];
  const route = routes.find((candidate) => candidate.path === normalizedPath);
  if (route) {
    return {
      kind: "page",
      route,
    };
  }

  const redirect = redirects.find((candidate) => candidate.fromPath === normalizedPath);
  if (redirect) {
    return {
      kind: "redirect",
      redirect,
    };
  }

  return {
    kind: "not_found",
  };
}

export function resolveWebsitePageByPath(
  structure: WebsiteStructure,
  path: string,
): { page?: WebsiteStructure["pages"][number]; route?: WebsiteRouteRecord; redirectTo?: string } {
  const resolved = resolveWebsiteRoute(structure.routing, path);
  const pages = Array.isArray(structure.pages) ? structure.pages : [];

  if (resolved.kind === "redirect") {
    return {
      redirectTo: resolved.redirect.toPath,
    };
  }

  if (resolved.kind === "page") {
    return {
      route: resolved.route,
      page: pages.find((page) => page.id === resolved.route.pageId),
    };
  }

  const normalized = normalizePath(path);
  const fallbackPage = pages.find((page) => normalizePath(page.slug) === normalized);
  return {
    page: fallbackPage,
    route: fallbackPage
      ? {
          kind: "page",
          pageId: fallbackPage.id,
          slug: fallbackPage.slug,
          path: fallbackPage.slug,
          title: fallbackPage.title,
          visible: fallbackPage.visible !== false,
          order: fallbackPage.order,
        }
      : undefined,
  };
}
