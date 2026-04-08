import { createFallbackNavigation } from "./fallback";
import { validateWebsiteNavigation } from "./schemas";
import type { NavigationGenerationContext, WebsiteNavigation } from "./types";

export function ensureValidNavigation(
  navigation: WebsiteNavigation,
  context: NavigationGenerationContext,
): { navigation: WebsiteNavigation; errors: string[]; usedFallback: boolean } {
  const errors = validateWebsiteNavigation(navigation);
  if (errors.length === 0) {
    return { navigation, errors, usedFallback: false };
  }

  return {
    navigation: createFallbackNavigation(context.websiteType, context.siteTitle),
    errors,
    usedFallback: true,
  };
}
