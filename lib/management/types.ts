import type { WebsiteStructure, WebsiteStructureStatus, WebsiteType } from "@/lib/ai/structure";
import type { PublishingStatusModel, PublishingStatusUiState } from "@/lib/publish/status";
import type { ContentScheduleSummary } from "@/lib/scheduling";

export type WebsiteLifecycleStatus = PublishingStatusUiState;

export type WebsiteStatusFilter = WebsiteLifecycleStatus | "all";
export type WebsitePublishStateFilter = PublishingStatusUiState | "all";
export type WebsiteTypeFilter = WebsiteType | "all";

export interface WebsiteManagementRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: WebsiteLifecycleStatus;
  structureStatus: WebsiteStructureStatus;
  websiteType: WebsiteType;
  publicationState: PublishingStatusUiState;
  publishStatus: PublishingStatusModel;
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
  publishState?: WebsitePublishStateFilter;
  websiteType?: WebsiteTypeFilter;
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface WebsiteListPage {
  websites: WebsiteManagementRecord[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface WebsiteListResponse {
  ok: true;
  websites: WebsiteManagementRecord[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
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
