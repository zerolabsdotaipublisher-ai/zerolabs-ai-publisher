import type { WebsiteStructure } from "@/lib/ai/structure";
import { getPublicationMetadata } from "./model";
import type { PublicationDetection, PublicationState } from "./types";

function deriveState(structure: WebsiteStructure): PublicationState {
  const publication = getPublicationMetadata(structure);
  const hasPublishedVersion = typeof publication.publishedVersion === "number";
  const hasUnpublishedChanges =
    hasPublishedVersion && publication.publishedVersion !== undefined
      ? structure.version > publication.publishedVersion
      : false;

  if (publication.state === "publishing") {
    return "publishing";
  }

  if (publication.state === "update_failed") {
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
  const hasUnpublishedChanges =
    hasPublishedVersion && publication.publishedVersion !== undefined
      ? structure.version > publication.publishedVersion
      : false;

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
  };
}
