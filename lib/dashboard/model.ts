import { routes } from "@/config/routes";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { toPublishingStatusLabel } from "@/lib/publish/status";
import type { WebsiteManagementRecord } from "@/lib/management";
import { DASHBOARD_MVP_BOUNDARIES, DASHBOARD_QUICK_ACTIONS } from "./schema";
import { fetchDashboardStorageSnapshot } from "./storage";
import type { DashboardSummary, DashboardWebsiteSummary } from "./types";

export { isDashboardSummaryEmpty, getDefaultDashboardErrorMessage } from "./client";

interface BuildDashboardSummaryOptions {
  userId: string;
  email: string;
  displayName?: string;
}

type ProjectVisibilityRow = {
  id: string;
  source_structure_id?: string | null;
  visibility?: string | null;
};

type StructureVisibilityRow = {
  id: string;
  visibility?: string | null;
};

type WebsitePageCountRow = {
  structure_id?: string | null;
  website_project_id?: string | null;
};

export async function buildDashboardWebsiteSummary(
  userId: string,
  websites: WebsiteManagementRecord[],
): Promise<DashboardWebsiteSummary> {
  const supabase = getSupabaseServiceClient();

  let projectRows: ProjectVisibilityRow[] | null = null;
  try {
    const { data } = await supabase
      .from("website_projects")
      .select("id, source_structure_id, visibility")
      .eq("user_id", userId);
    projectRows = data as unknown as ProjectVisibilityRow[];
  } catch {
    // Ignore error, fallback mapping will be used
  }

  let structureRows: StructureVisibilityRow[] | null = null;
  try {
    const { data } = await supabase
      .from("website_structures")
      .select("id, visibility")
      .eq("user_id", userId);
    structureRows = data as unknown as StructureVisibilityRow[];
  } catch {
    // Ignore error, fallback mapping will be used
  }

  const visibilityMap = new Map<string, "public" | "private">();

  if (structureRows) {
    for (const row of structureRows) {
      if (row.visibility === "public" || row.visibility === "private") {
        visibilityMap.set(row.id, row.visibility);
      }
    }
  }

  if (projectRows) {
    for (const row of projectRows) {
      if (row.visibility === "public" || row.visibility === "private") {
        visibilityMap.set(row.id, row.visibility);
        if (row.source_structure_id) {
          visibilityMap.set(row.source_structure_id, row.visibility);
        }
      }
    }
  }

  let pageRows: WebsitePageCountRow[] | null = null;
  try {
    const { data } = await supabase
      .from("website_pages")
      .select("structure_id, website_project_id")
      .eq("user_id", userId);
    pageRows = data as unknown as WebsitePageCountRow[];
  } catch {
    try {
      const { data } = await supabase
        .from("website_pages")
        .select("structure_id")
        .eq("user_id", userId);
      pageRows = data as unknown as WebsitePageCountRow[];
    } catch {
      // Ignore errors for optional tables
    }
  }

  const pageCountMap = new Map<string, number>();
  if (pageRows) {
    for (const row of pageRows) {
      if (row.structure_id) {
        pageCountMap.set(row.structure_id, (pageCountMap.get(row.structure_id) || 0) + 1);
      }
      if (row.website_project_id) {
        pageCountMap.set(row.website_project_id, (pageCountMap.get(row.website_project_id) || 0) + 1);
      }
    }
  }

  const generatedWebsites = websites.map((website) => {
    return {
      id: website.id,
      title: website.title || "Untitled Website",
      status: website.status,
      statusLabel: toPublishingStatusLabel(website.status),
      createdAt: website.generatedAt,
      updatedAt: website.lastUpdatedAt,
      publishedAt: website.lastPublishedAt ?? undefined,
      previewPath: website.liveUrl || website.previewPath,
      editorPath: website.editorPath,
      visibility: visibilityMap.get(website.id) ?? "private",
      pageCount: pageCountMap.get(website.id),
      pageCountSource: pageCountMap.has(website.id) ? ("website_pages" as const) : ("unavailable" as const),
    };
  });

  const storedPages = pageRows ? pageRows.length : null;
  const storedVersions = null;

  const dataSource = "website_structures";

  return {
    total: generatedWebsites.length,
    published: generatedWebsites.filter((website) => website.status === "live").length,
    draft: generatedWebsites.filter((website) => website.status === "draft").length,
    archived: generatedWebsites.filter((website) => website.status === "archived").length,
    attentionRequired: generatedWebsites.filter((website) => website.status === "failed").length,
    storedPages,
    storedVersions,
    dataSource,
    generatedWebsites,
  };
}

export async function buildDashboardSummary(options: BuildDashboardSummaryOptions): Promise<DashboardSummary> {
  const [snapshot] = await Promise.all([
    fetchDashboardStorageSnapshot(options.userId),
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
