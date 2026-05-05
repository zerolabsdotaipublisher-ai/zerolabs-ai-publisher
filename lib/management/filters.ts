import type {
  WebsiteManagementRecord,
  WebsitePublishStateFilter,
  WebsiteStatusFilter,
  WebsiteTypeFilter,
} from "./types";

export function filterWebsitesByStatus(
  websites: WebsiteManagementRecord[],
  status: WebsiteStatusFilter = "all",
  includeDeleted = false,
): WebsiteManagementRecord[] {
  return filterWebsites(websites, { status, includeDeleted });
}

export function filterWebsites(
  websites: WebsiteManagementRecord[],
  options: {
    status?: WebsiteStatusFilter;
    publishState?: WebsitePublishStateFilter;
    websiteType?: WebsiteTypeFilter;
    includeDeleted?: boolean;
  } = {},
): WebsiteManagementRecord[] {
  const status = options.status ?? "all";
  const publishState = options.publishState ?? "all";
  const websiteType = options.websiteType ?? "all";
  const includeDeleted = options.includeDeleted ?? false;

  return websites.filter((website) => {
    if (!includeDeleted && website.status === "deleted") {
      return false;
    }

    if (status !== "all" && website.status !== status) {
      return false;
    }

    if (publishState !== "all" && website.publicationState !== publishState) {
      return false;
    }

    if (websiteType !== "all" && website.websiteType !== websiteType) {
      return false;
    }

    return true;
  });
}

export function sortWebsitesByUpdatedAt(websites: WebsiteManagementRecord[]): WebsiteManagementRecord[] {
  return websites.slice().sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt));
}
