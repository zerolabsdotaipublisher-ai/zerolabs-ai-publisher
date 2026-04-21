import type { WebsiteStructure } from "@/lib/ai/structure";
import { getWebsiteRoutingConfig } from "@/lib/routing";
import type { PreviewPageOption } from "./types";

export function mapPreviewPages(structure: WebsiteStructure): PreviewPageOption[] {
  const pagesById = new Map(structure.pages.map((page) => [page.id, page]));
  return getWebsiteRoutingConfig(structure).routes
    .map((route) => {
      const page = pagesById.get(route.pageId);
      if (!page) {
        return undefined;
      }

      return {
        id: page.id,
        slug: route.path,
        title: page.title,
        order: page.order,
      };
    })
    .filter((page): page is PreviewPageOption => Boolean(page))
    .sort((a, b) => a.order - b.order);
}
