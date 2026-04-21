import { isReservedRoutePath } from "./reserved";
import { isValidRoutePath } from "./slugs";
import type { WebsiteRouteRecord, WebsiteRouteValidationResult } from "./types";

export function validateWebsiteRoutes(routes: WebsiteRouteRecord[]): WebsiteRouteValidationResult {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const route of routes) {
    if (!isValidRoutePath(route.path)) {
      errors.push(`Invalid route path: ${route.path}`);
    }

    if (isReservedRoutePath(route.path)) {
      errors.push(`Reserved route path is not allowed for generated pages: ${route.path}`);
    }

    if (seen.has(route.path)) {
      errors.push(`Duplicate route path: ${route.path}`);
    }
    seen.add(route.path);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
