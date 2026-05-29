import type { WebsiteStructure, WebsiteStructureStatus } from "@/lib/ai/structure";
import type { ManualOverrideStatus } from "@/lib/publish/override/types";
import type {
  PublicationDeploymentStatus,
  PublicationDetection,
  PublishTargetContentType,
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
  manualOverride?: {
    overrideUsed: boolean;
    overrideReason: string;
    overrideTimestamp: string;
    overrideUserId: string;
    bypassedWorkflows: Array<"approval" | "schedule">;
    targetContentId: string;
    targetContentType: PublishTargetContentType;
    scenario: "urgent_publish" | "hotfix_update" | "bypass_scheduled_time" | "bypass_approval";
    approvalBypassed: boolean;
  };
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
  overrideStatus?: ManualOverrideStatus;
  error?: string;
}
