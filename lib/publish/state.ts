import type { WebsiteStructure, WebsiteStructureStatus } from "@/lib/ai/structure";
import { detectPublicationState } from "./detection";
import { getPublicationMetadata, withPublicationMetadata } from "./model";

function resolveStructureStatus(
  currentStatus: WebsiteStructureStatus,
  state: "draft" | "published",
): WebsiteStructureStatus {
  if (currentStatus === "archived") {
    return "archived";
  }

  return state;
}

export function markDraftUpdatedForPublication(structure: WebsiteStructure, updatedAt: string): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const detection = detectPublicationState(structure);
  let nextState = publication.state;

  if (detection.neverPublished) {
    nextState = "draft";
  } else if (detection.hasUnpublishedChanges) {
    nextState = "update_pending";
  }

  return withPublicationMetadata(
    {
      ...structure,
      status: resolveStructureStatus(structure.status, detection.neverPublished ? "draft" : "published"),
    },
    {
      ...publication,
      state: nextState,
      lastDraftUpdatedAt: updatedAt,
    },
  );
}

export function markPublishing(structure: WebsiteStructure, attemptedAt: string): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  return withPublicationMetadata(structure, {
    ...publication,
    state: "publishing",
    lastPublishAttemptAt: attemptedAt,
    lastError: undefined,
  });
}

export function markPublished(
  structure: WebsiteStructure,
  params: { liveUrl: string; livePath: string; publishedAt: string },
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const firstPublishedAt = publication.firstPublishedAt || params.publishedAt;

  return withPublicationMetadata(
    {
      ...structure,
      status: resolveStructureStatus(structure.status, "published"),
    },
    {
      ...publication,
      state: "published",
      publishedVersion: structure.version,
      liveUrl: params.liveUrl,
      livePath: params.livePath,
      firstPublishedAt,
      lastPublishedAt: params.publishedAt,
      lastUpdatedAt: params.publishedAt,
      lastError: undefined,
    },
  );
}

export function markPublishFailure(
  structure: WebsiteStructure,
  attemptedAt: string,
  errorMessage: string,
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);

  return withPublicationMetadata(structure, {
    ...publication,
    state: "update_failed",
    lastPublishAttemptAt: attemptedAt,
    lastError: errorMessage,
  });
}
