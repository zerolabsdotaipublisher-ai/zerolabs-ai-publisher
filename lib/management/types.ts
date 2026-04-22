import type { PublicationState } from "@/lib/publish";
import type { WebsiteStructure, WebsiteStructureStatus } from "@/lib/ai/structure";
import type { ContentScheduleSummary } from "@/lib/scheduling";

export type WebsiteLifecycleStatus =
  | "draft"
  | "published"
  | "update_pending"
  | "publishing"
  | "update_failed"
  | "unpublished"
  | "archived"
  | "deleted";

export type WebsiteStatusFilter = WebsiteLifecycleStatus | "all";

export interface WebsiteManagementRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: WebsiteLifecycleStatus;
  structureStatus: WebsiteStructureStatus;
  publicationState: PublicationState;
  lastUpdatedAt: string;
  lastPublishedAt?: string;
  generatedAt: string;
  liveUrl?: string;
  previewPath: string;
  editorPath: string;
  generatedSitePath: string;
  deletedAt?: string;
  deletionState: "active" | "deleted";
  supportsBulkActions: boolean;
  schedule?: ContentScheduleSummary;
}

export interface WebsiteListingOptions {
  query?: string;
  status?: WebsiteStatusFilter;
  includeDeleted?: boolean;
}

export interface WebsiteListResponse {
  ok: true;
  websites: WebsiteManagementRecord[];
}

export interface WebsiteMutationResponse {
  ok: boolean;
  website?: WebsiteManagementRecord;
  error?: string;
}

export interface WebsiteRenamePayload {
  structureId: string;
  title: string;
  description?: string;
}

export interface WebsiteStatusPayload {
  structureId: string;
  status: "archive" | "activate";
}

export interface WebsiteDeletePayload {
  structureId: string;
  hardDelete?: boolean;
}

export interface WebsiteOwnershipResult {
  owned: boolean;
  website?: WebsiteStructure;
}

export interface WebsiteDeletionStrategy {
  mode: "soft" | "hard";
  hardDeleteEnabled: boolean;
  recoverable: boolean;
}
