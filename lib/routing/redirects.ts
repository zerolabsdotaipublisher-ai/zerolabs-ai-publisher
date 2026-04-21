import type { WebsiteRouteRecord, WebsiteRouteRedirect } from "./types";

export function createRedirectsForRouteChanges(params: {
  previousRoutes: WebsiteRouteRecord[];
  nextRoutes: WebsiteRouteRecord[];
  generatedAt: string;
}): WebsiteRouteRedirect[] {
  const previousByPageId = new Map(params.previousRoutes.map((route) => [route.pageId, route]));
  const redirects: WebsiteRouteRedirect[] = [];

  for (const route of params.nextRoutes) {
    const previous = previousByPageId.get(route.pageId);
    if (!previous || previous.path === route.path) {
      continue;
    }

    redirects.push({
      fromPath: previous.path,
      toPath: route.path,
      permanent: true,
      reason: "slug_changed",
      createdAt: params.generatedAt,
    });
  }

  return redirects;
}
