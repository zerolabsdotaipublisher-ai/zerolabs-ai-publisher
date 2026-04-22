import { filterWebsitesByStatus, sortWebsitesByUpdatedAt } from "./filters";
import { toWebsiteManagementRecord } from "./model";
import { searchWebsites } from "./search";
import { listOwnedWebsiteStructures } from "./storage";
import { listOwnedContentSchedules, toContentScheduleSummary } from "@/lib/scheduling";
import type { WebsiteListingOptions, WebsiteManagementRecord } from "./types";

export async function listManagedWebsites(
  userId: string,
  options: WebsiteListingOptions = {},
): Promise<WebsiteManagementRecord[]> {
  const websites = await listOwnedWebsiteStructures(userId);
  const schedules = await listOwnedContentSchedules(userId);
  const scheduleMap = new Map(
    schedules.map((schedule) => [schedule.structureId, toContentScheduleSummary(schedule)]),
  );
  const records = websites.map((website) =>
    toWebsiteManagementRecord(website, scheduleMap.get(website.id)),
  );
  const filtered = filterWebsitesByStatus(records, options.status, options.includeDeleted);
  const searched = searchWebsites(filtered, options.query);
  return sortWebsitesByUpdatedAt(searched);
}
