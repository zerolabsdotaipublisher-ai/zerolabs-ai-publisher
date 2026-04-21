import type { WebsiteStructure } from "@/lib/ai/structure";
import { getPublicationMetadata } from "./model";
import { planDeploymentUpdate } from "./versioning";
import type { PublicationDetection, PublicationState } from "./types";

function hasUnpublishedSavedChanges(structure: WebsiteStructure): boolean {
  const publication = getPublicationMetadata(structure);
  const hasPublishedVersion = typeof publication.publishedVersion === "number";

  if (!hasPublishedVersion) {
    return false;
  }

  const pending = publication.updates?.pending;
  if (pending) {
    return pending.required;
  }

  const liveFingerprint = publication.updates?.liveFingerprint;
  if (liveFingerprint) {
    return planDeploymentUpdate(structure, { liveFingerprint }).required;
  }

  const publishedVersion = publication.publishedVersion ?? 0;
  return structure.version > publishedVersion;
}

function deriveState(structure: WebsiteStructure): PublicationState {
  const publication = getPublicationMetadata(structure);
  const hasPublishedVersion = typeof publication.publishedVersion === "number";
  const hasUnpublishedChanges = hasUnpublishedSavedChanges(structure);

  if (publication.state === "publishing" || publication.updates?.queue?.activeRequestId) {
    return "publishing";
  }

  if (publication.state === "update_failed" && hasUnpublishedChanges) {
    return "update_failed";
  }

  if (hasPublishedVersion && hasUnpublishedChanges) {
    return "update_pending";
  }

  if (hasPublishedVersion) {
    return "published";
  }

  if (publication.state === "unpublished") {
    return "unpublished";
  }

  return "draft";
}

export function detectPublicationState(structure: WebsiteStructure): PublicationDetection {
  const publication = getPublicationMetadata(structure);
  const state = deriveState(structure);
  const hasPublishedVersion = typeof publication.publishedVersion === "number";
  const hasUnpublishedChanges = hasUnpublishedSavedChanges(structure);

  return {
    state,
    neverPublished: !hasPublishedVersion,
    isPublishing: state === "publishing",
    hasUnpublishedChanges,
    hasFailedUpdate: state === "update_failed",
    canPublish: state !== "publishing",
    publishedVersion: publication.publishedVersion,
    liveUrl: publication.liveUrl,
    lastPublishedAt: publication.lastPublishedAt,
    lastDraftUpdatedAt: publication.lastDraftUpdatedAt,
    lastError: publication.lastError,
    deploymentStatus: publication.deployment?.status,
    pendingUpdate: publication.updates?.pending,
    liveVersionId: publication.updates?.liveVersionId,
  };
}
