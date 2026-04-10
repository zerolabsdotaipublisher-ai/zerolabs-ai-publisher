import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PreviewPageOption } from "./types";

export function mapPreviewPages(structure: WebsiteStructure): PreviewPageOption[] {
  return structure.pages
    .map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      order: page.order,
    }))
    .sort((a, b) => a.order - b.order);
}
