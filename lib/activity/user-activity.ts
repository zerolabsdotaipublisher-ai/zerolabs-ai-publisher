import { listManagedWebsites, type WebsiteManagementRecord } from "@/lib/management";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export interface UserPublishingActivityOverview {
  generatedAt: string;
  isAvailable: boolean;
  websites: WebsiteManagementRecord[];
  totalWebsites: number;
  draftWebsites: number;
  publishedWebsites: number;
  recentGenerations: number;
}

export async function getUserPublishingActivityOverview(userId: string): Promise<UserPublishingActivityOverview> {
  let websites: WebsiteManagementRecord[] = [];
  let isAvailable = true;

  try {
    const supabase = getSupabaseServiceClient();
    // 1. Fetch from normalized tables
    const { data: projects, error: projectsError } = await supabase
      .from("website_projects")
      .select("id, title, status, website_type, created_at, updated_at, source_structure_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 2. Fetch from existing structures (legacy/fallback)
    const legacyWebsites = await listManagedWebsites(userId, { status: "all", includeDeleted: false });

    if (!projectsError && projects) {
      // Merge results, preferring the new table
      const legacyMap = new Map(legacyWebsites.map(w => [w.id, w]));

      const newWebsites: WebsiteManagementRecord[] = projects.map(p => {
        // Fallback to legacy record if source_structure_id matches an old record to retain full compatibility
        const legacyMatch = p.source_structure_id ? legacyMap.get(p.source_structure_id) : undefined;

        return legacyMatch ? {
            ...legacyMatch,
            title: p.title || legacyMatch.title,
            status: "draft",
        } : {
            id: p.id,
            userId: userId,
            title: p.title || "Untitled",
            status: "draft",
            structureStatus: "generated",
            websiteType: (p.website_type || "landing-page") as import("@/lib/ai/prompts/types").WebsiteType,
            publicationState: "draft",
            publishStatus: {
                structureId: p.id,
                userId: userId,
                uiState: "draft",
                uiLabel: "Draft",
                backend: { structureStatus: "generated", publicationState: "draft", hasDeletedAt: false },
                detection: { state: "draft", neverPublished: true, isPublishing: false, hasUnpublishedChanges: true, hasFailedUpdate: false, canPublish: true },
                validation: { ok: true, eligible: true, errors: [], validationScope: "draft", hasWarnings: false, ruleResults: [] },
                timestamps: { created: p.created_at, lastAnalyzed: p.created_at, lastUpdatedAt: p.updated_at },
                hasUnpublishedChanges: true,
                isTransitional: false,
                action: { publishAction: "publish" as const, publishActionLabel: "Publish", canTriggerPublishAction: true }
            },
            lastUpdatedAt: p.updated_at,
            generatedAt: p.created_at,
            previewPath: `/preview/${p.id}`,
            editorPath: `/editor/${p.id}`,
            analyticsConfigured: false,
            generatedSitePath: `/preview/${p.id}`,
            deletionState: 'active',
            supportsBulkActions: false,
        };
      });

      // Add legacy websites that aren't mapped
      const mappedStructureIds = new Set(projects.map(p => p.source_structure_id).filter(Boolean));
      const unmappedLegacy = legacyWebsites.filter(w => !mappedStructureIds.has(w.id));

      websites = [...newWebsites, ...unmappedLegacy].sort((a, b) => {
        const timeA = new Date(a.lastUpdatedAt || a.generatedAt || 0).getTime();
        const timeB = new Date(b.lastUpdatedAt || b.generatedAt || 0).getTime();
        return timeB - timeA;
      });
    } else {
      websites = legacyWebsites;
    }
  } catch (error) {
    console.error("Error fetching user websites for activity overview:", error);
    isAvailable = false;
  }

  const draftWebsites = websites.filter(w => w.publicationState === "draft" || w.publicationState === "unpublished_changes").length;
  const publishedWebsites = websites.filter(w => w.publicationState === "live" || w.publicationState === "publishing" || w.publicationState === "updating").length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentGenerations = websites.filter(w => w.generatedAt && new Date(w.generatedAt) >= thirtyDaysAgo).length;

  return {
    generatedAt: new Date().toISOString(),
    isAvailable,
    websites,
    totalWebsites: websites.length,
    draftWebsites,
    publishedWebsites,
    recentGenerations,
  };
}
