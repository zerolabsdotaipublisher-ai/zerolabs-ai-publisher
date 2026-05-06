import type { WebsiteStructure, WebsiteStructureStatus } from "@/lib/ai/structure";
import type {
  PublicationDeploymentStatus,
  PublicationDetection,
  PublicationState,
  PublishAction,
  PublishValidationResult,
} from "@/lib/publish/types";

export type PublishingStatusUiState =
  | "draft"
  | "publishing"
  | "updating"
  | "live"
  | "unpublished_changes"
  | "failed"
  | "archived"
  | "deleted";

export interface PublishingStatusBackendState {
  structureStatus: WebsiteStructureStatus;
  publicationState: PublicationState;
  deploymentStatus?: PublicationDeploymentStatus;
  hasDeletedAt: boolean;
}

export interface PublishingStatusTimestamps {
  lastUpdatedAt: string;
  lastPublishedAt?: string;
  lastDraftUpdatedAt?: string;
}

export interface PublishingStatusActionModel {
  publishAction: PublishAction;
  publishActionLabel: string;
  canTriggerPublishAction: boolean;
  disableReason?: string;
}

export interface PublishingStatusModel {
  structureId: string;
  userId: string;
  uiState: PublishingStatusUiState;
  uiLabel: string;
  backend: PublishingStatusBackendState;
  detection: PublicationDetection;
  validation: PublishValidationResult;
  timestamps: PublishingStatusTimestamps;
  hasUnpublishedChanges: boolean;
  isTransitional: boolean;
  failureMessage?: string;
  liveUrl?: string;
  action: PublishingStatusActionModel;
}

export interface BuildPublishingStatusModelParams {
  structure: WebsiteStructure;
  detection: PublicationDetection;
  validation: PublishValidationResult;
}

export interface PublishStatusApiResponse {
  ok: boolean;
  status?: PublishingStatusModel;
  error?: string;
}
