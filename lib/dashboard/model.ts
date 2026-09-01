import { routes } from "@/config/routes";
import { listOwnedReviewRecords } from "@/lib/review/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { toPublishingStatusLabel, type PublishingStatusUiState } from "@/lib/publish/status";
import type { WebsiteManagementRecord } from "@/lib/management";
import { buildDashboardRecentActivity } from "./activity";
import { buildDashboardAlerts } from "./alerts";
import { buildDashboardMetrics } from "./metrics";
import { DASHBOARD_MVP_BOUNDARIES, DASHBOARD_QUICK_ACTIONS, isAccountAttentionRequired } from "./schema";
import { fetchDashboardStorageSnapshot } from "./storage";
import type { DashboardSummary, DashboardWebsiteSummary } from "./types";

export { isDashboardSummaryEmpty, getDefaultDashboardErrorMessage } from "./client";

interface BuildDashboardSummaryOptions {
  memberSince?: string;
  userId: string;
  email: string;
  displayName?: string;
}

interface WebsiteStructureInventoryRow {
  id: string;
  site_title: string;
  status: string;
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

interface WebsiteProjectPageRow {
  website_project_id: string | null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
    .select("id, site_title, status, generated_at, updated_at, structure")
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

async function listOwnedWebsitePages(userId: string): Promise<WebsiteProjectPageRow[] | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_pages")
    .select("website_project_id")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? []) as WebsiteProjectPageRow[];
}

async function countOwnedWebsiteVersions(userId: string): Promise<number | null> {
  const supabase = getSupabaseServiceClient();
  const { count, error } = await supabase
    .from("website_versions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return readCount(count);
}

function buildLegacyWebsiteCards(args: {
  websites: WebsiteManagementRecord[];
  structureRows: Map<string, WebsiteStructureInventoryRow>;
  visibilityMap: Map<string, "public" | "private">;
}): DashboardWebsiteSummary["generatedWebsites"] {
  return sortByUpdatedAtDescending(
    args.websites.map((website) => ({
      id: website.id,
      title: website.title,
      status: website.status,
      statusLabel: toPublishingStatusLabel(website.status),
      createdAt: website.generatedAt,
      updatedAt: website.lastUpdatedAt,
      publishedAt: website.lastPublishedAt,
      generatedSitePath: website.generatedSitePath,
      previewPath: website.previewPath,
      editorPath: website.editorPath,
      visibility: args.visibilityMap.get(website.id) ?? "private",
      pageCount: countStructurePages(args.structureRows.get(website.id)),
      pageCountSource: args.structureRows.has(website.id) ? "website_structures" : "unavailable",
    })),
  );
}

async function buildDashboardWebsiteSummary(
  userId: string,
  websites: WebsiteManagementRecord[],
): Promise<DashboardWebsiteSummary> {
  const [structureRows, visibilityMap, projectRows, websitePageRows, storedVersions] = await Promise.all([
    listOwnedStructureInventory(userId),
    listOwnedStructureVisibility(userId),
    listOwnedWebsiteProjects(userId),
    listOwnedWebsitePages(userId),
    countOwnedWebsiteVersions(userId),
  ]);

  const structureRowMap = new Map(structureRows.map((row) => [row.id, row]));
  const structurePageTotal = structureRows.reduce((total, row) => total + (countStructurePages(row) ?? 0), 0);
  const legacyWebsiteMap = new Map(websites.map((website) => [website.id, website]));

  if (!projectRows || projectRows.length === 0) {
    const generatedWebsites = buildLegacyWebsiteCards({
      websites,
      structureRows: structureRowMap,
      visibilityMap,
    });

    return {
      total: generatedWebsites.length,
      published: generatedWebsites.filter((website) => website.status === "live").length,
      draft: generatedWebsites.filter((website) => isDraftWebsiteStatus(website.status)).length,
      archived: generatedWebsites.filter((website) => website.status === "archived").length,
      attentionRequired: generatedWebsites.filter((website) => website.status === "failed").length,
      storedPages: generatedWebsites.length > 0 ? structurePageTotal : 0,
      storedVersions,
      dataSource: "website_structures",
      generatedWebsites,
    };
  }

  const projectPageCountMap = new Map<string, number>();
  if (websitePageRows) {
    for (const row of websitePageRows) {
      const projectId = readString(row.website_project_id);
      if (!projectId) {
        continue;
      }

      projectPageCountMap.set(projectId, (projectPageCountMap.get(projectId) ?? 0) + 1);
    }
  }

  const mappedStructureIds = new Set<string>();
  const generatedWebsites = projectRows.map((project) => {
    const structureId = readString(project.source_structure_id);
    const legacyWebsite = structureId ? legacyWebsiteMap.get(structureId) : undefined;
    const structureRow = structureId ? structureRowMap.get(structureId) : undefined;
    const status = legacyWebsite?.status ?? toProjectLifecycleStatus(project.status);
    const pageCountFromPages = projectPageCountMap.get(project.id);
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
      generatedSitePath: structureId ? routes.generatedSite(structureId) : legacyWebsite?.generatedSitePath,
      previewPath: structureId ? routes.previewSite(structureId) : legacyWebsite?.previewPath,
      editorPath: structureId ? routes.editorSite(structureId) : legacyWebsite?.editorPath,
      visibility: project.visibility ?? visibilityMap.get(structureId ?? "") ?? "private",
      pageCount:
        pageCountFromPages ??
        pageCountFromProject ??
        pageCountFromStructure,
      pageCountSource,
    };
  });

  const fallbackStructureCards = buildLegacyWebsiteCards({
    websites: websites.filter((website) => !mappedStructureIds.has(website.id)),
    structureRows: structureRowMap,
    visibilityMap,
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
  const [snapshot, reviewRecords] = await Promise.all([
    fetchDashboardStorageSnapshot(options.userId),
    listOwnedReviewRecords(options.userId),
  ]);
  const websiteSummary = await buildDashboardWebsiteSummary(options.userId, snapshot.websites);

  const contentSummary = {
    totalGenerated: snapshot.generatedContent.total,
    websiteGenerated: snapshot.generatedContent.website,
    blogGenerated: snapshot.generatedContent.blog,
    articleGenerated: snapshot.generatedContent.article,
    publishedContent: snapshot.generatedContent.published,
    scheduledContent:
      snapshot.generatedContent.scheduled +
      snapshot.websites.filter(
        (website) => website.schedule?.status === "active" || website.schedule?.status === "running",
      ).length,
    pendingApproval: reviewRecords.filter((record) => record.state === "pending_review").length,
  };

  const socialSummary = {
    connectedAccounts: snapshot.socialAccounts.filter((account) => account.status === "connected").length,
    accountsNeedingAttention: snapshot.socialAccounts.filter(isAccountAttentionRequired).length,
    generatedPosts: snapshot.socialPosts.length,
    scheduledPosts: snapshot.socialSchedules.filter((schedule) =>
      ["scheduled", "queued", "retry_pending"].includes(schedule.status),
    ).length,
    publishedPosts: snapshot.socialPosts.filter((post) => Boolean(post.publishedAt)).length,
    failedPublishes: snapshot.socialHistory.filter((history) => history.status === "failed").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: options.userId,
      email: options.email,
      displayName: options.displayName,
      memberSince: options.memberSince,
    },
    metrics: buildDashboardMetrics(snapshot, websiteSummary),
    quickActions: DASHBOARD_QUICK_ACTIONS,
    recentActivity: buildDashboardRecentActivity(snapshot),
    websiteSummary,
    contentSummary,
    socialSummary,
    alerts: buildDashboardAlerts(snapshot),
    mvpBoundaries: [...DASHBOARD_MVP_BOUNDARIES],
  };
}

export function getDashboardFallbackHref(): string {
  return routes.websites;
}
