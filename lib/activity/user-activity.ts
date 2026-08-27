import { listManagedWebsites, type WebsiteManagementRecord } from "@/lib/management";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export interface UserPublishingActivityOverview {
  generatedAt: string;
  isAvailable: boolean;
  websites: (WebsiteManagementRecord & { numberOfPages?: number })[];
  totalWebsites: number;
  draftWebsites: number;
  publishedWebsites: number;
  recentGenerations: number;
  storedVersions: number;
}

export async function getUserPublishingActivityOverview(userId: string): Promise<UserPublishingActivityOverview> {
  let websites: (WebsiteManagementRecord & { numberOfPages?: number })[] = [];
  let isAvailable = true;
  let storedVersions = 0;

  let legacyWebsites: WebsiteManagementRecord[] = [];
  try {
    // 2. Fetch from existing structures (legacy/fallback)
    legacyWebsites = await listManagedWebsites(userId, { status: "all", includeDeleted: false });
  } catch (legacyError) {
    console.error("Error fetching legacy user websites for activity overview:", legacyError);
    // don't mark completely unavailable if legacy fails, new ones might succeed
  }

  try {
    const supabase = getSupabaseServiceClient();
    // 1. Fetch from normalized tables
    const { data: projects, error: projectsError } = await supabase
      .from("website_projects")
      .select("id, title, status, website_type, created_at, updated_at, source_structure_id, number_of_pages")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { count: pagesCount } = await supabase
      .from("website_pages")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);

    storedVersions = pagesCount || 0;

    if (!projectsError && projects) {
      // Merge results, preferring the new table
      const legacyMap = new Map(legacyWebsites.map(w => [w.id, w]));

      const newWebsites: (WebsiteManagementRecord & { numberOfPages?: number })[] = projects.map(p => {
        // Fallback to legacy record if source_structure_id matches an old record to retain full compatibility
        const legacyMatch = p.source_structure_id ? legacyMap.get(p.source_structure_id) : undefined;

        // Ensure preview routes point to old structures if that is where preview routes fetch from, otherwise use the project id.
        const routeId = p.source_structure_id ? p.source_structure_id : p.id;

        const publicationState = (p.status === "published" ? "live" : "draft") as import("@/lib/publish/status").PublishingStatusUiState;
        const backendPublicationState = (p.status === "published" ? "live" : "draft") as import("@/lib/publish/types").PublicationState;

        return legacyMatch ? {
            ...legacyMatch,
            title: p.title || legacyMatch.title,
            status: p.status === "published" ? "live" : "draft",
            publicationState,
            numberOfPages: p.number_of_pages,
            previewPath: `/preview/${routeId}`,
            editorPath: `/editor/${routeId}`,
            generatedSitePath: `/preview/${routeId}`,
        } : {
            id: p.id,
            userId: userId,
            title: p.title || "Untitled",
            status: p.status === "published" ? "live" : "draft",
            structureStatus: "generated",
            websiteType: (p.website_type || "landing-page") as import("@/lib/ai/prompts/types").WebsiteType,
            publicationState,
            publishStatus: {
                structureId: p.id,
                userId: userId,
                uiState: p.status === "published" ? "live" : "draft",
                uiLabel: p.status === "published" ? "Live" : "Draft",
                backend: { structureStatus: "generated", publicationState: backendPublicationState, hasDeletedAt: false },
                detection: { state: backendPublicationState, neverPublished: true, isPublishing: false, hasUnpublishedChanges: true, hasFailedUpdate: false, canPublish: true },
                validation: { ok: true, eligible: true, errors: [], validationScope: "draft", hasWarnings: false, ruleResults: [] },
                timestamps: { created: p.created_at, lastAnalyzed: p.created_at, lastUpdatedAt: p.updated_at },
                hasUnpublishedChanges: true,
                isTransitional: false,
                action: { publishAction: "publish" as const, publishActionLabel: "Publish", canTriggerPublishAction: true }
            },
            lastUpdatedAt: p.updated_at,
            generatedAt: p.created_at,
            previewPath: `/preview/${routeId}`,
            editorPath: `/editor/${routeId}`,
            generatedSitePath: `/preview/${routeId}`,
            deletionState: 'active',
            supportsBulkActions: false,
            numberOfPages: p.number_of_pages,
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
      if (projectsError) {
          console.error("Error fetching projects: ", projectsError);
      }
      websites = legacyWebsites;
    }
  } catch (error) {
    console.error("Error fetching user websites for activity overview:", error);
    // Only mark unavailable if everything failed
    if (legacyWebsites.length === 0) {
      isAvailable = false;
    } else {
      websites = legacyWebsites;
    }
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
    storedVersions,
  };
}
