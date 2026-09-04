import { filterWebsites, sortWebsitesByUpdatedAt } from "./filters";
import { toWebsiteManagementRecord } from "./model";
import { searchWebsites } from "./search";
import { listOwnedWebsiteStructures } from "./storage";
import { logger } from "@/lib/observability";
import { listOwnedContentSchedules, toContentScheduleSummary } from "@/lib/scheduling";
import type { WebsiteListPage, WebsiteListingOptions, WebsiteManagementRecord } from "./types";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 50;

function parsePositiveInt(value: number | string | undefined, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizePagination(options: WebsiteListingOptions): { page: number; perPage: number } {
  const page = Math.max(DEFAULT_PAGE, parsePositiveInt(options.page, DEFAULT_PAGE));
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parsePositiveInt(options.perPage, DEFAULT_PER_PAGE)),
  );
  return { page, perPage };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isMissingOptionalScheduleSchemaError(
  error: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  } | null | undefined,
): boolean {
  const code = readString(error?.code);
  const searchable = [
    readString(error?.message),
    readString(error?.details),
    readString(error?.hint),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    searchable.includes("schema cache") ||
    searchable.includes("could not find the table") ||
    searchable.includes("could not find the column") ||
    ((searchable.includes("relation") || searchable.includes("column")) && searchable.includes("does not exist"))
  );
}

async function listOwnedContentSchedulesBestEffort(userId: string) {
  try {
    return await listOwnedContentSchedules(userId);
  } catch (error) {
    if (isMissingOptionalScheduleSchemaError(error as Parameters<typeof isMissingOptionalScheduleSchemaError>[0])) {
      logger.warn("Website listing is continuing without content schedule summaries", {
        category: "error",
        service: "dashboard",
        userId,
        error: {
          name: "ContentScheduleCompatibilityWarning",
          message: error instanceof Error ? error.message : String(error),
        },
      });
      return [];
    }

    throw error;
  }
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
  const [websites, schedules] = await Promise.all([
    listOwnedWebsiteStructures(userId),
    options.includeSchedules === false ? Promise.resolve([]) : listOwnedContentSchedulesBestEffort(userId),
  ]);
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
