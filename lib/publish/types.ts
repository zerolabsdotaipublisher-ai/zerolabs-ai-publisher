import type { WebsiteStructure } from "@/lib/ai/structure";

export type PublicationState =
  | "draft"
  | "publishing"
  | "published"
  | "update_pending"
  | "update_failed"
  | "unpublished";

export type PublishAction = "publish" | "update";

export type PublicationDeploymentEnvironment = "preview" | "production";

export type PublicationDeploymentStatus =
  | "queued"
  | "validating"
  | "building"
  | "deploying"
  | "updating"
  | "deployed"
  | "ready"
  | "failed";

export interface PublicationHostingLogEntry {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface PublicationDeploymentMetadata {
  deploymentId?: string;
  providerDeploymentId?: string;
  target?: string;
  environment: PublicationDeploymentEnvironment;
  status: PublicationDeploymentStatus;
  url?: string;
  path?: string;
  domains?: string[];
  attempts?: number;
  updatedAt: string;
  lastError?: string;
  providerMetadata?: Record<string, unknown>;
  logs?: PublicationHostingLogEntry[];
}

export interface PublicationMetadata {
  state: PublicationState;
  publishedVersion?: number;
  liveUrl?: string;
  livePath?: string;
  deployment?: PublicationDeploymentMetadata;
  firstPublishedAt?: string;
  lastPublishedAt?: string;
  lastDraftUpdatedAt?: string;
  lastPublishAttemptAt?: string;
  lastUpdatedAt?: string;
  lastError?: string;
}

export interface PublicationDetection {
  state: PublicationState;
  neverPublished: boolean;
  isPublishing: boolean;
  hasUnpublishedChanges: boolean;
  hasFailedUpdate: boolean;
  canPublish: boolean;
  publishedVersion?: number;
  liveUrl?: string;
  lastPublishedAt?: string;
  lastDraftUpdatedAt?: string;
  lastError?: string;
}

export interface PublishValidationResult {
  eligible: boolean;
  errors: string[];
}

export interface PublishDeliveryResult {
  liveUrl: string;
  livePath: string;
  deploymentId: string;
  deliveredAt: string;
  deployment?: PublicationDeploymentMetadata;
}

export interface PublishStatusResponse {
  ok: boolean;
  detection: PublicationDetection;
  validation: PublishValidationResult;
}

export interface PublishMutationResponse {
  ok: boolean;
  structure?: WebsiteStructure;
  detection?: PublicationDetection;
  validation?: PublishValidationResult;
  error?: string;
}

export interface PublishTrackingPayload {
  event: PublishTrackingEvent;
  structureId: string;
  action: PublishAction;
  state?: PublicationState;
  message?: string;
}

export type PublishTrackingEvent =
  | "publish_started"
  | "publish_completed"
  | "publish_failed"
  | "publish_retry_clicked"
  | "update_completed";
