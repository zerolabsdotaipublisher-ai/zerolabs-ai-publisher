import type { WebsiteManagementRecord } from "./types";

export function searchWebsites(websites: WebsiteManagementRecord[], query?: string): WebsiteManagementRecord[] {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) {
    return websites;
  }

  return websites.filter((website) => {
    return (
      website.title.toLowerCase().includes(normalized)
      || website.description?.toLowerCase().includes(normalized)
      || website.id.toLowerCase().includes(normalized)
    );
  });
}
