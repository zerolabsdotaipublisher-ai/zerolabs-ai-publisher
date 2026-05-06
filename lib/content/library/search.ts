import type { ContentLibraryItem } from "./types";

export function searchContentLibraryItems(items: ContentLibraryItem[], search?: string): ContentLibraryItem[] {
  const normalized = search?.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [
      item.title,
      item.linkedWebsite?.title,
      item.linkedCampaign,
      ...item.keywords,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
