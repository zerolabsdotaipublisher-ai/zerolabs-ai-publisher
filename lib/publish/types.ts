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

export type PublicationUpdateChangeKind =
  | "content"
  | "structure"
  | "layout"
  | "seo"
  | "routing";

export type PublicationUpdateTrigger = PublicationUpdateChangeKind | "manual";

export type PublicationUpdateAttemptStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "noop";

export interface PublicationHostingLogEntry {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface PublicationUpdateLogEntry extends PublicationHostingLogEntry {
  phase:
    | "analysis"
    | "queue"
    | "deployment"
    | "cache"
    | "domain"
    | "completion"
    | "retry";
  requestId?: string;
}

export interface PublicationStructureFingerprintPage {
  pageId: string;
  path: string;
  assetPaths: string[];
  signatures: Record<PublicationUpdateChangeKind, string>;
}

export interface PublicationStructureFingerprint {
  generatedAt: string;
  site: Record<PublicationUpdateChangeKind, string>;
  pages: PublicationStructureFingerprintPage[];
  routePaths: string[];
  assetPaths: string[];
}

export interface PublicationUpdateScope {
  fullSite: boolean;
  metadataOnly: boolean;
  pageIds: string[];
  routePaths: string[];
  assetPaths: string[];
  changeKinds: PublicationUpdateChangeKind[];
}

export interface PublicationUpdatePlan {
  required: boolean;
  triggeredBy: PublicationUpdateTrigger[];
  scope: PublicationUpdateScope;
  summary: string;
  comparedAt: string;
  fingerprint: PublicationStructureFingerprint;
}

export interface PublicationRetryMetadata {
  retryable: boolean;
  retryCount: number;
  recommendedAction: "retry" | "fix_and_retry" | "manual_review";
  lastAttemptAt?: string;
}

export interface PublicationUpdateQueueMetadata {
  activeRequestId?: string;
  requestedAt?: string;
  startedAt?: string;
  completedAt?: string;
  lastCompletedRequestId?: string;
  duplicateRequests: number;
}

export interface PublicationUpdateAttempt {
  requestId: string;
  action: PublishAction;
  status: PublicationUpdateAttemptStatus;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  retryable?: boolean;
  update?: PublicationUpdatePlan;
}

export interface PublicationCacheInvalidationMetadata {
  strategy: "full-site-redeploy" | "targeted-path-refresh";
  provider: "provider-neutral" | "vercel";
  affectedPaths: string[];
  assetPaths: string[];
  notes: string;
  invalidatedAt?: string;
}

export interface PublicationDomainSnapshot {
  liveUrl: string;
  livePath: string;
  domains: string[];
  providerDeploymentUrl?: string;
  preservedLivePath: boolean;
  preservedDomains: boolean;
}

export interface PublicationStaticSiteMetadata {
  pageCount: number;
  routeCount: number;
  assetCount: number;
  routePaths: string[];
  assetPaths: string[];
}

export interface PublicationRollbackMetadata {
  providerSupport: "metadata-only" | "manual" | "native";
  rollbackReady: boolean;
  currentVersionId?: string;
  previousStableVersionId?: string;
}

export interface PublicationVersionRecord {
  versionId: string;
  structureVersion: number;
  publishedAt: string;
  deploymentId?: string;
  providerDeploymentId?: string;
  status: PublicationDeploymentStatus;
  live: boolean;
  liveUrl: string;
  livePath: string;
  domains: string[];
  update: PublicationUpdatePlan;
  cache: PublicationCacheInvalidationMetadata;
  domain: PublicationDomainSnapshot;
  staticSite: PublicationStaticSiteMetadata;
  rollback: PublicationRollbackMetadata;
  logs?: PublicationHostingLogEntry[];
}

export interface PublicationUpdateMetadata {
  liveVersionId?: string;
  liveFingerprint?: PublicationStructureFingerprint;
  pending?: PublicationUpdatePlan;
  queue?: PublicationUpdateQueueMetadata;
  current?: PublicationUpdateAttempt;
  retry?: PublicationRetryMetadata;
  rollback?: PublicationRollbackMetadata;
  cache?: PublicationCacheInvalidationMetadata;
  domain?: PublicationDomainSnapshot;
  staticSite?: PublicationStaticSiteMetadata;
  history?: PublicationVersionRecord[];
  logs?: PublicationUpdateLogEntry[];
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
  updates?: PublicationUpdateMetadata;
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
  deploymentStatus?: PublicationDeploymentStatus;
  pendingUpdate?: PublicationUpdatePlan;
  liveVersionId?: string;
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
  staticSite: PublicationStaticSiteMetadata;
  domain: PublicationDomainSnapshot;
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
  message?: string;
  requestId?: string;
  didDeploy?: boolean;
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
  | "update_completed"
  | "update_noop";
