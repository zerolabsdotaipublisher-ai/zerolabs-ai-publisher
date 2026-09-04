import "server-only";

import { routes } from "@/config/routes";
import type { WebsiteManagementRecord } from "@/lib/management";
import { logger } from "@/lib/observability";
import { toPublishingStatusLabel, type PublishingStatusUiState } from "@/lib/publish/status";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { DASHBOARD_MVP_BOUNDARIES, DASHBOARD_QUICK_ACTIONS } from "./schema";
import { fetchDashboardStorageSnapshot } from "./storage";
import type { DashboardSummary, DashboardWebsiteSummary } from "./types";

export { isDashboardSummaryEmpty, getDefaultDashboardErrorMessage } from "./client";

interface BuildDashboardSummaryOptions {
  userId: string;
  email: string;
  displayName?: string;
}

interface WebsiteStructureInventoryRow {
  id: string;
  site_title: string;
  generated_at: string;
  updated_at: string;
  structure: {
    pages?: unknown[];
  } | null;
}

interface WebsiteStructureVisibilityRow {
  id: string;
  visibility: "public" | "private" | null;
}

interface WebsiteProjectInventoryRow {
  id: string;
  title: string | null;
  status: string | null;
  visibility: "public" | "private" | null;
  created_at: string;
  updated_at: string;
  source_structure_id: string | null;
  number_of_pages: number | null;
}

interface WebsitePageCountRow {
  structure_id?: string | null;
  website_project_id?: string | null;
}

interface WebsiteProjectDesignConfigRow {
  website_project_id: string | null;
  color_palette: unknown;
}

interface ProjectDesignConfigPreview {
  designConfigured: boolean;
  thumbnailAccentColor?: string;
  thumbnailSurfaceColor?: string;
}

type CountFilter =
  | { type: "eq"; column: string; value: string }
  | { type: "in"; column: string; value: string[] };

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function collectHexColors(value: unknown, colors: string[], depth = 0): void {
  if (depth > 4 || colors.length >= 4) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const matches = trimmed.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
    if (matches) {
      for (const match of matches) {
        if (!colors.includes(match)) {
          colors.push(match);
        }
      }
    }

    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && colors.length < 4) {
      try {
        collectHexColors(JSON.parse(trimmed), colors, depth + 1);
      } catch {
        // Ignore malformed serialized design config values.
      }
    }

    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectHexColors(entry, colors, depth + 1);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      collectHexColors(entry, colors, depth + 1);
    }
  }
}

function isMissingSchemaError(error: {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
} | null | undefined): boolean {
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

async function listIdsForUser(table: string, userId: string): Promise<string[] | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? [])
    .map((row) => readString((row as { id?: unknown }).id))
    .filter((value): value is string => Boolean(value));
}

async function listIdsForFirstAvailableTable(tables: string[], userId: string): Promise<string[] | null> {
  for (const table of tables) {
    const ids = await listIdsForUser(table, userId);
    if (ids !== null) {
      return ids;
    }
  }

  return null;
}

async function countRows(table: string, filters: CountFilter[] = []): Promise<number | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  for (const filter of filters) {
    query =
      filter.type === "eq"
        ? query.eq(filter.column, filter.value)
        : query.in(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return typeof count === "number" ? count : 0;
}

async function countFirstAvailableTable(tables: string[], filters: CountFilter[] = []): Promise<number | null> {
  for (const table of tables) {
    const count = await countRows(table, filters);
    if (count !== null) {
      return count;
    }
  }

  return null;
}

function createOwnedIdFilter(column: string, values: string[]): CountFilter {
  if (values.length > 0) {
    return {
      type: "in",
      column,
      value: values,
    };
  }

  return {
    type: "eq",
    column,
    value: "__none__",
  };
}

function sumAvailableCounts(...values: Array<number | null>): number | null {
  const availableValues = values.filter((value): value is number => typeof value === "number");
  if (availableValues.length === 0) {
    return null;
  }

  return availableValues.reduce((total, value) => total + value, 0);
}

async function loadDashboardEngagementMetrics(
  userId: string,
): Promise<Pick<DashboardSummary["metrics"], "totalViews" | "totalHearts">> {
  try {
    const [ownedWebsiteIds, ownedFeedPostIds] = await Promise.all([
      listIdsForUser("website_structures", userId),
      listIdsForFirstAvailableTable(["community_posts", "feed_posts"], userId),
    ]);

    const websiteViewsPromise = ownedWebsiteIds
      ? countRows("website_view_events", [createOwnedIdFilter("website_id", ownedWebsiteIds)])
      : Promise.resolve(null);
    const profileViewsPromise = countRows("profile_view_events", [{ type: "eq", column: "profile_user_id", value: userId }]);
    const websiteHeartsPromise = ownedWebsiteIds
      ? countRows("website_reactions", [
          createOwnedIdFilter("website_id", ownedWebsiteIds),
          { type: "eq", column: "reaction_type", value: "heart" },
        ])
      : Promise.resolve(null);
    const postHeartsPromise = ownedFeedPostIds
      ? countFirstAvailableTable(["community_post_reactions", "feed_post_reactions"], [
          createOwnedIdFilter("post_id", ownedFeedPostIds),
          { type: "eq", column: "reaction_type", value: "heart" },
        ])
      : Promise.resolve(null);

    const [websiteViews, profileViews, websiteHearts, postHearts] = await Promise.all([
      websiteViewsPromise,
      profileViewsPromise,
      websiteHeartsPromise,
      postHeartsPromise,
    ]);

    return {
      totalViews: sumAvailableCounts(websiteViews, profileViews),
      totalHearts: sumAvailableCounts(websiteHearts, postHearts),
    };
  } catch (error) {
    logger.info("Dashboard is continuing without optional engagement metrics", {
      category: "config",
      service: "dashboard",
      userId,
      error: {
        name: "DashboardEngagementCompatibilityWarning",
        message: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      totalViews: null,
      totalHearts: null,
    };
  }
}

function countStructurePages(row: WebsiteStructureInventoryRow | undefined): number | undefined {
  if (!row?.structure || !Array.isArray(row.structure.pages)) {
    return undefined;
  }

  return row.structure.pages.length;
}

function toProjectLifecycleStatus(status: string | null | undefined): PublishingStatusUiState {
  switch (status) {
    case "published":
      return "live";
    case "publishing":
      return "publishing";
    case "updating":
      return "updating";
    case "failed":
      return "failed";
    case "archived":
      return "archived";
    case "deleted":
      return "deleted";
    default:
      return "draft";
  }
}

function isDraftWebsiteStatus(status: PublishingStatusUiState): boolean {
  return status === "draft" || status === "unpublished_changes";
}

function sortByUpdatedAtDescending<T extends { updatedAt: string; createdAt: string }>(rows: T[]): T[] {
  return rows.slice().sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt).getTime();
    return rightTime - leftTime;
  });
}

export function getDashboardUserDisplayName(userMetadata: unknown): string | undefined {
  if (!userMetadata || typeof userMetadata !== "object") {
    return undefined;
  }

  const value = (userMetadata as { full_name?: unknown }).full_name;
  return typeof value === "string" ? value : undefined;
}

async function listOwnedStructureInventory(userId: string): Promise<WebsiteStructureInventoryRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_structures")
    .select("id, site_title, generated_at, updated_at, structure")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as WebsiteStructureInventoryRow[];
}

async function listOwnedStructureVisibility(userId: string): Promise<Map<string, "public" | "private">> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_structures")
    .select("id, visibility")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return new Map();
    }

    throw error;
  }

  return new Map(
    ((data ?? []) as WebsiteStructureVisibilityRow[])
      .filter((row): row is WebsiteStructureVisibilityRow & { visibility: "public" | "private" } => Boolean(row.visibility))
      .map((row) => [row.id, row.visibility]),
  );
}

async function listOwnedWebsiteProjects(userId: string): Promise<WebsiteProjectInventoryRow[] | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_projects")
    .select("id, title, status, visibility, created_at, updated_at, source_structure_id, number_of_pages")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? []) as WebsiteProjectInventoryRow[];
}

async function listOwnedWebsitePages(userId: string): Promise<WebsitePageCountRow[] | null> {
  const supabase = getSupabaseServiceClient();

  const combined = await supabase
    .from("website_pages")
    .select("structure_id, website_project_id")
    .eq("user_id", userId);

  if (!combined.error) {
    return (combined.data ?? []) as WebsitePageCountRow[];
  }

  if (!isMissingSchemaError(combined.error)) {
    throw combined.error;
  }

  const structureOnly = await supabase
    .from("website_pages")
    .select("structure_id")
    .eq("user_id", userId);

  if (!structureOnly.error) {
    return (structureOnly.data ?? []) as WebsitePageCountRow[];
  }

  if (!isMissingSchemaError(structureOnly.error)) {
    throw structureOnly.error;
  }

  const projectOnly = await supabase
    .from("website_pages")
    .select("website_project_id")
    .eq("user_id", userId);

  if (!projectOnly.error) {
    return (projectOnly.data ?? []) as WebsitePageCountRow[];
  }

  if (isMissingSchemaError(projectOnly.error)) {
    return null;
  }

  throw projectOnly.error;
}

async function listOwnedWebsiteDesignConfigs(userId: string): Promise<WebsiteProjectDesignConfigRow[] | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_design_configs")
    .select("website_project_id, color_palette")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? []) as WebsiteProjectDesignConfigRow[];
}

async function countOwnedWebsiteVersions(userId: string): Promise<number> {
  const supabase = getSupabaseServiceClient();
  const { count, error } = await supabase
    .from("website_versions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return 0;
    }

    throw error;
  }

  return readCount(count) ?? 0;
}

function createProjectDesignConfigMap(rows: WebsiteProjectDesignConfigRow[] | null): Map<string, ProjectDesignConfigPreview> {
  if (!rows?.length) {
    return new Map();
  }

  const entries: Array<[string, ProjectDesignConfigPreview]> = [];

  for (const row of rows) {
    const projectId = readString(row.website_project_id);
    if (!projectId) {
      continue;
    }

    const colors: string[] = [];
    collectHexColors(row.color_palette, colors);

    entries.push([
      projectId,
      {
        designConfigured: true,
        thumbnailAccentColor: colors[0],
        thumbnailSurfaceColor: colors[1],
      },
    ]);
  }

  return new Map(entries);
}

function buildLegacyWebsiteCards(args: {
  websites: WebsiteManagementRecord[];
  structureRows: Map<string, WebsiteStructureInventoryRow>;
  visibilityMap: Map<string, "public" | "private">;
  pageCountMap: Map<string, number>;
}): DashboardWebsiteSummary["generatedWebsites"] {
  return sortByUpdatedAtDescending(
    args.websites.map((website) => {
      const pageCountFromPages = args.pageCountMap.get(website.id);
      const pageCountFromStructure = countStructurePages(args.structureRows.get(website.id));

      return {
        id: website.id,
        title: website.title || "Untitled website",
        status: website.status,
        statusLabel: toPublishingStatusLabel(website.status),
        createdAt: website.generatedAt,
        updatedAt: website.lastUpdatedAt,
        publishedAt: website.lastPublishedAt,
        liveUrl: website.liveUrl,
        generatedSitePath: website.generatedSitePath,
        previewPath: website.previewPath,
        editorPath: website.editorPath,
        visibility: args.visibilityMap.get(website.id) ?? "private",
        pageCount: pageCountFromPages ?? pageCountFromStructure,
        pageCountSource:
          pageCountFromPages !== undefined
            ? "website_pages"
            : args.structureRows.has(website.id)
              ? "website_structures"
              : "unavailable",
        designConfigured: false,
      };
    }),
  );
}

async function buildDashboardWebsiteSummary(
  userId: string,
  websites: WebsiteManagementRecord[],
): Promise<DashboardWebsiteSummary> {
  const [structureRows, visibilityMap, projectRows, websitePageRows, designConfigRows, storedVersions] = await Promise.all([
    listOwnedStructureInventory(userId),
    listOwnedStructureVisibility(userId),
    listOwnedWebsiteProjects(userId),
    listOwnedWebsitePages(userId),
    listOwnedWebsiteDesignConfigs(userId),
    countOwnedWebsiteVersions(userId),
  ]);

  const structureRowMap = new Map(structureRows.map((row) => [row.id, row]));
  const structurePageTotal = structureRows.reduce((total, row) => total + (countStructurePages(row) ?? 0), 0);
  const legacyWebsiteMap = new Map(websites.map((website) => [website.id, website]));
  const designConfigMap = createProjectDesignConfigMap(designConfigRows);
  const pageCountMap = new Map<string, number>();

  if (websitePageRows) {
    for (const row of websitePageRows) {
      const structureId = readString(row.structure_id);
      const projectId = readString(row.website_project_id);

      if (structureId) {
        pageCountMap.set(structureId, (pageCountMap.get(structureId) ?? 0) + 1);
      }

      if (projectId) {
        pageCountMap.set(projectId, (pageCountMap.get(projectId) ?? 0) + 1);
      }
    }
  }

  if (!projectRows || projectRows.length === 0) {
    const generatedWebsites = buildLegacyWebsiteCards({
      websites,
      structureRows: structureRowMap,
      visibilityMap,
      pageCountMap,
    });

    return {
      total: generatedWebsites.length,
      published: generatedWebsites.filter((website) => website.status === "live").length,
      draft: generatedWebsites.filter((website) => isDraftWebsiteStatus(website.status)).length,
      archived: generatedWebsites.filter((website) => website.status === "archived").length,
      attentionRequired: generatedWebsites.filter((website) => website.status === "failed").length,
      storedPages: websitePageRows !== null ? websitePageRows.length : generatedWebsites.length > 0 ? structurePageTotal : 0,
      storedVersions,
      dataSource: "website_structures",
      generatedWebsites,
    };
  }

  const mappedStructureIds = new Set<string>();
  const generatedWebsites = projectRows.map((project) => {
    const structureId = readString(project.source_structure_id);
    const legacyWebsite = structureId ? legacyWebsiteMap.get(structureId) : undefined;
    const structureRow = structureId ? structureRowMap.get(structureId) : undefined;
    const status = legacyWebsite?.status ?? toProjectLifecycleStatus(project.status);
    const pageCountFromPages =
      pageCountMap.get(project.id) ??
      (structureId ? pageCountMap.get(structureId) : undefined);
    const pageCountFromProject = readCount(project.number_of_pages);
    const pageCountFromStructure = countStructurePages(structureRow);
    const pageCountSource: DashboardWebsiteSummary["generatedWebsites"][number]["pageCountSource"] =
      pageCountFromPages !== undefined
        ? "website_pages"
        : pageCountFromProject !== null
          ? "website_projects"
          : pageCountFromStructure !== undefined
            ? "website_structures"
            : "unavailable";

    if (structureId) {
      mappedStructureIds.add(structureId);
    }

    const designConfig = designConfigMap.get(project.id);

    return {
      id: structureId ?? project.id,
      title:
        readString(project.title) ??
        legacyWebsite?.title ??
        readString(structureRow?.site_title) ??
        "Untitled website",
      status,
      statusLabel: toPublishingStatusLabel(status),
      createdAt: project.created_at || legacyWebsite?.generatedAt || structureRow?.generated_at || project.updated_at,
      updatedAt: project.updated_at || legacyWebsite?.lastUpdatedAt || structureRow?.updated_at || project.created_at,
      publishedAt: legacyWebsite?.lastPublishedAt,
      liveUrl: legacyWebsite?.liveUrl,
      generatedSitePath: structureId ? routes.generatedSite(structureId) : legacyWebsite?.generatedSitePath,
      previewPath: structureId ? routes.previewSite(structureId) : legacyWebsite?.previewPath,
      editorPath: structureId ? routes.editorSite(structureId) : legacyWebsite?.editorPath,
      visibility: project.visibility ?? (structureId ? visibilityMap.get(structureId) : undefined) ?? "private",
      pageCount: pageCountFromPages ?? pageCountFromProject ?? pageCountFromStructure,
      pageCountSource,
      designConfigured: designConfig?.designConfigured ?? false,
      thumbnailAccentColor: designConfig?.thumbnailAccentColor,
      thumbnailSurfaceColor: designConfig?.thumbnailSurfaceColor,
    };
  });

  const fallbackStructureCards = buildLegacyWebsiteCards({
    websites: websites.filter((website) => !mappedStructureIds.has(website.id)),
    structureRows: structureRowMap,
    visibilityMap,
    pageCountMap,
  });
  const mergedGeneratedWebsites = sortByUpdatedAtDescending([
    ...generatedWebsites,
    ...fallbackStructureCards,
  ]);
  const storedPages =
    websitePageRows !== null
      ? websitePageRows.length
      : projectRows.reduce((total, project) => total + (readCount(project.number_of_pages) ?? 0), 0) || structurePageTotal;

  return {
    total: mergedGeneratedWebsites.length,
    published: mergedGeneratedWebsites.filter((website) => website.status === "live").length,
    draft: mergedGeneratedWebsites.filter((website) => isDraftWebsiteStatus(website.status)).length,
    archived: mergedGeneratedWebsites.filter((website) => website.status === "archived").length,
    attentionRequired: mergedGeneratedWebsites.filter((website) => website.status === "failed").length,
    storedPages,
    storedVersions,
    dataSource: fallbackStructureCards.length > 0 ? "hybrid" : "website_projects",
    generatedWebsites: mergedGeneratedWebsites,
  };
}

export async function buildDashboardSummary(options: BuildDashboardSummaryOptions): Promise<DashboardSummary> {
  const [snapshot, engagementMetrics] = await Promise.all([
    fetchDashboardStorageSnapshot(options.userId),
    loadDashboardEngagementMetrics(options.userId),
  ]);
  const websiteSummary = await buildDashboardWebsiteSummary(options.userId, snapshot.websites);

  const contentSummary = {
    totalGenerated: 0,
    websiteGenerated: 0,
    blogGenerated: 0,
    articleGenerated: 0,
    publishedContent: 0,
    scheduledContent: 0,
    pendingApproval: 0,
  };

  const socialSummary = {
    connectedAccounts: 0,
    accountsNeedingAttention: 0,
    generatedPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    failedPublishes: 0,
  };

  const metrics = {
    totalWebsites: websiteSummary.total,
    draftWebsites: websiteSummary.draft,
    publishedWebsites: websiteSummary.published,
    totalViews: engagementMetrics.totalViews,
    totalHearts: engagementMetrics.totalHearts,
    storedPages: websiteSummary.storedPages,
    storedVersions: websiteSummary.storedVersions,
    publishedItems: websiteSummary.published,
    generatedContentCount: 0,
    scheduledItems: 0,
    attentionRequiredItems: websiteSummary.attentionRequired,
  };

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: options.userId,
      email: options.email,
      displayName: options.displayName,
    },
    metrics,
    quickActions: DASHBOARD_QUICK_ACTIONS,
    recentActivity: [],
    websiteSummary,
    contentSummary,
    socialSummary,
    alerts: [],
    mvpBoundaries: [...DASHBOARD_MVP_BOUNDARIES],
  };
}

export function getDashboardFallbackHref(): string {
  return routes.websites;
}
