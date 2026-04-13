import { filterWebsitesByStatus, sortWebsitesByUpdatedAt } from "./filters";
import { toWebsiteManagementRecord } from "./model";
import { searchWebsites } from "./search";
import { listOwnedWebsiteStructures } from "./storage";
import type { WebsiteListingOptions, WebsiteManagementRecord } from "./types";

export async function listManagedWebsites(
  userId: string,
  options: WebsiteListingOptions = {},
): Promise<WebsiteManagementRecord[]> {
  const websites = await listOwnedWebsiteStructures(userId);
  const records = websites.map(toWebsiteManagementRecord);
  const filtered = filterWebsitesByStatus(records, options.status, options.includeDeleted);
  const searched = searchWebsites(filtered, options.query);
  return sortWebsitesByUpdatedAt(searched);
}
