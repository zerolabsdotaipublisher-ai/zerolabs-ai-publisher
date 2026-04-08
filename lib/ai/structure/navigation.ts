/**
 * Story 3-5 navigation compatibility adapter.
 *
 * Keeps Story 3-2 call sites stable while delegating navigation + hierarchy
 * generation to the centralized app-owned navigation module.
 */

import {
  generateValidatedWebsiteNavigation,
  type NavigationOverrideInput,
  type WebsiteNavigation,
} from "../navigation";
import type { WebsiteType } from "../prompts/types";
import type { WebsitePage } from "./types";

export function generateNavigation(
  websiteType: WebsiteType,
  pages: WebsitePage[],
  siteTitle: string,
  _copyrightYear?: number,
  overrides?: NavigationOverrideInput,
): WebsiteNavigation {
  const result = generateValidatedWebsiteNavigation(
    {
      websiteType,
      siteTitle,
      pages: pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        type: page.type,
        order: page.order,
        visible: page.visible ?? true,
        parentPageId: page.parentPageId,
        priority: page.priority,
        includeInNavigation:
          page.navigation?.includeInHeader ||
          page.navigation?.includeInFooter ||
          page.navigation?.includeInSidebar ||
          false,
        navigationLabel: page.navigationLabel,
      })),
    },
    overrides,
  );

  return result.navigation;
}
