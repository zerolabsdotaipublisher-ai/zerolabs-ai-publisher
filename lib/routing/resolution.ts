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
  const route = config.routes.find((candidate) => candidate.path === normalizedPath);
  if (route) {
    return {
      kind: "page",
      route,
    };
  }

  const redirect = config.redirects.find((candidate) => candidate.fromPath === normalizedPath);
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

  if (resolved.kind === "redirect") {
    return {
      redirectTo: resolved.redirect.toPath,
    };
  }

  if (resolved.kind === "page") {
    return {
      route: resolved.route,
      page: structure.pages.find((page) => page.id === resolved.route.pageId),
    };
  }

  const normalized = normalizePath(path);
  const fallbackPage = structure.pages.find((page) => normalizePath(page.slug) === normalized);
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
