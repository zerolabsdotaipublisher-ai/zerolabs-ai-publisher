import type { WebsiteManagementRecord } from "./types";

export function searchWebsites(websites: WebsiteManagementRecord[], query?: string): WebsiteManagementRecord[] {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) {
    return websites;
  }

  return websites.filter((website) => website.title.toLowerCase().includes(normalized));
}
