import { listManagedWebsites, type WebsiteManagementRecord } from "@/lib/management";

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
    websites = await listManagedWebsites(userId, { status: "all", includeDeleted: false });
  } catch (error) {
    console.error("Error fetching user websites for activity overview:", error);
    isAvailable = false;
  }

  const draftWebsites = websites.filter(w => w.publicationState === "draft" || w.publicationState === "unpublished_changes").length;
  const publishedWebsites = websites.filter(w => w.publicationState === "live" || w.publicationState === "publishing" || w.publicationState === "updating").length;

  // Calculate recent generations based on generatedAt within last 30 days
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
