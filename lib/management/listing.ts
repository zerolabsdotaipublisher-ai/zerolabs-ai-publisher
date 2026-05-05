import { filterWebsites, sortWebsitesByUpdatedAt } from "./filters";
import { toWebsiteManagementRecord } from "./model";
import { searchWebsites } from "./search";
import { listOwnedWebsiteStructures } from "./storage";
import { listOwnedContentSchedules, toContentScheduleSummary } from "@/lib/scheduling";
import type { WebsiteListPage, WebsiteListingOptions, WebsiteManagementRecord } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 50;

function normalizePagination(options: WebsiteListingOptions): { page: number; perPage: number } {
  const page = Math.max(DEFAULT_PAGE, Number.parseInt(String(options.page ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number.parseInt(String(options.perPage ?? DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE),
  );
  return { page, perPage };
}

function toPaginatedResult(
  websites: WebsiteManagementRecord[],
  page: number,
  perPage: number,
): WebsiteListPage {
  const total = websites.length;
  const startIndex = (page - 1) * perPage;
  const paged = websites.slice(startIndex, startIndex + perPage);
  const hasMore = startIndex + perPage < total;

  return {
    websites: paged,
    total,
    page,
    perPage,
    hasMore,
  };
}

async function buildManagedWebsiteRecords(
  userId: string,
  options: WebsiteListingOptions,
): Promise<WebsiteManagementRecord[]> {
  const websites = await listOwnedWebsiteStructures(userId);
  const schedules = await listOwnedContentSchedules(userId);
  const scheduleMap = new Map(
    schedules.map((schedule) => [schedule.structureId, toContentScheduleSummary(schedule)]),
  );
  const records = websites.map((website) =>
    toWebsiteManagementRecord(website, scheduleMap.get(website.id)),
  );
  const filtered = filterWebsites(records, {
    status: options.status,
    includeDeleted: options.includeDeleted,
    publishState: options.publishState,
    websiteType: options.websiteType,
  });
  const searched = searchWebsites(filtered, options.query);
  return sortWebsitesByUpdatedAt(searched);
}

export async function listManagedWebsites(
  userId: string,
  options: WebsiteListingOptions = {},
): Promise<WebsiteManagementRecord[]> {
  return buildManagedWebsiteRecords(userId, options);
}

export async function listManagedWebsitesPage(
  userId: string,
  options: WebsiteListingOptions = {},
): Promise<WebsiteListPage> {
  const { page, perPage } = normalizePagination(options);
  const sorted = await buildManagedWebsiteRecords(userId, options);
  return toPaginatedResult(sorted, page, perPage);
}
