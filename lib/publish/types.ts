import type { WebsiteStructure } from "@/lib/ai/structure";

export type PublicationState =
  | "draft"
  | "publishing"
  | "published"
  | "update_pending"
  | "update_failed"
  | "unpublished";

export type PublishAction = "publish" | "update";

export interface PublicationMetadata {
  state: PublicationState;
  publishedVersion?: number;
  liveUrl?: string;
  livePath?: string;
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
