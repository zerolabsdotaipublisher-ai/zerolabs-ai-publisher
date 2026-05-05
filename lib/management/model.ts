import { routes } from "@/config/routes";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { detectPublicationState } from "@/lib/publish";
import type { ContentScheduleSummary } from "@/lib/scheduling";
import type { WebsiteLifecycleStatus, WebsiteManagementRecord } from "./types";

export function isSoftDeleted(structure: WebsiteStructure): boolean {
  return Boolean(structure.management?.deletedAt || structure.management?.deletionState === "deleted");
}

export function deriveWebsiteLifecycleStatus(structure: WebsiteStructure): WebsiteLifecycleStatus {
  if (isSoftDeleted(structure) || structure.status === "deleted") {
    return "deleted";
  }

  if (structure.status === "archived") {
    return "archived";
  }

  return detectPublicationState(structure).state;
}

export function toWebsiteManagementRecord(
  structure: WebsiteStructure,
  schedule?: ContentScheduleSummary,
): WebsiteManagementRecord {
  const publication = detectPublicationState(structure);
  const title = structure.management?.displayName?.trim() || structure.siteTitle;
  const description = structure.management?.description?.trim() || structure.tagline;

  return {
    id: structure.id,
    userId: structure.userId,
    title,
    description,
    status: deriveWebsiteLifecycleStatus(structure),
    structureStatus: structure.status,
    websiteType: structure.websiteType,
    publicationState: publication.state,
    generatedAt: structure.generatedAt,
    lastUpdatedAt: structure.updatedAt,
    lastPublishedAt: publication.lastPublishedAt,
    liveUrl: publication.liveUrl,
    previewPath: routes.previewSite(structure.id),
    editorPath: routes.editorSite(structure.id),
    generatedSitePath: routes.generatedSite(structure.id),
    deletedAt: structure.management?.deletedAt,
    deletionState: isSoftDeleted(structure) ? "deleted" : "active",
    supportsBulkActions: true,
    schedule,
  };
}
