import type { ContentLibraryItem, ContentLibraryQuery } from "./types";

export function filterContentLibraryItems(
  items: ContentLibraryItem[],
  query: Pick<ContentLibraryQuery, "type" | "status" | "websiteId">,
): ContentLibraryItem[] {
  return items.filter((item) => {
    if (query.type !== "all" && item.type !== query.type) {
      return false;
    }

    if (query.status !== "all" && item.status !== query.status) {
      return false;
    }

    if (query.websiteId !== "all" && item.linkedWebsite?.structureId !== query.websiteId) {
      return false;
    }

    return true;
  });
}
