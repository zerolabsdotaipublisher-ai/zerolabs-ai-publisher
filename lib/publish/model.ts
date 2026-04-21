import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PublicationMetadata, PublicationState } from "./types";

const DEFAULT_PUBLICATION_STATE: PublicationState = "draft";

export function getPublicationMetadata(structure: WebsiteStructure): PublicationMetadata {
  const metadata = structure.publication;

  if (!metadata) {
    return {
      state: DEFAULT_PUBLICATION_STATE,
      lastDraftUpdatedAt: structure.updatedAt,
      updates: {
        queue: {
          duplicateRequests: 0,
        },
      },
    };
  }

  return {
    state: metadata.state,
    publishedVersion: metadata.publishedVersion,
    liveUrl: metadata.liveUrl,
    livePath: metadata.livePath,
    deployment: metadata.deployment,
    firstPublishedAt: metadata.firstPublishedAt,
    lastPublishedAt: metadata.lastPublishedAt,
    lastDraftUpdatedAt: metadata.lastDraftUpdatedAt || structure.updatedAt,
    lastPublishAttemptAt: metadata.lastPublishAttemptAt,
    lastUpdatedAt: metadata.lastUpdatedAt,
    lastError: metadata.lastError,
    updates: {
      ...metadata.updates,
      queue: {
        duplicateRequests: metadata.updates?.queue?.duplicateRequests ?? 0,
        ...metadata.updates?.queue,
      },
    },
  };
}

export function withPublicationMetadata(
  structure: WebsiteStructure,
  publication: PublicationMetadata,
): WebsiteStructure {
  return {
    ...structure,
    publication,
  };
}
