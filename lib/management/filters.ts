import type { WebsiteManagementRecord, WebsiteStatusFilter } from "./types";

export function filterWebsitesByStatus(
  websites: WebsiteManagementRecord[],
  status: WebsiteStatusFilter = "all",
  includeDeleted = false,
): WebsiteManagementRecord[] {
  return websites.filter((website) => {
    if (!includeDeleted && website.status === "deleted") {
      return false;
    }

    if (status === "all") {
      return true;
    }

    return website.status === status;
  });
}

export function sortWebsitesByUpdatedAt(websites: WebsiteManagementRecord[]): WebsiteManagementRecord[] {
  return websites.slice().sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt));
}
