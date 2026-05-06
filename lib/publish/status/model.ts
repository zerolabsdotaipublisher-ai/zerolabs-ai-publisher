import { detectPublicationState } from "@/lib/publish/detection";
import { validatePublishEligibility } from "@/lib/publish/validation";
import type { BuildPublishingStatusModelParams, PublishingStatusModel } from "./types";
import { mapBackendStatusToUiState, toPublishingStatusLabel } from "./mapping";

function resolvePublishActionLabel(params: {
  neverPublished: boolean;
  hasUnpublishedChanges: boolean;
}): string {
  if (params.neverPublished) {
    return "Publish website";
  }

  if (params.hasUnpublishedChanges) {
    return "Publish updates";
  }

  return "Update live website";
}

export function buildPublishingStatusModel({
  structure,
  detection,
  validation,
}: BuildPublishingStatusModelParams): PublishingStatusModel {
  const uiState = mapBackendStatusToUiState({ structure, detection });
  const publishAction = detection.neverPublished ? "publish" : "update";
  const publishActionLabel = resolvePublishActionLabel({
    neverPublished: detection.neverPublished,
    hasUnpublishedChanges: detection.hasUnpublishedChanges,
  });

  let publishDisableReason: string | undefined;
  if (uiState === "deleted") {
    publishDisableReason = "Deleted websites cannot be published.";
  } else if (uiState === "archived") {
    publishDisableReason = "Archived websites cannot be published.";
  } else if (uiState === "publishing" || uiState === "updating") {
    publishDisableReason = "A publish operation is already in progress.";
  } else if (!validation.eligible) {
    publishDisableReason = "This website is not eligible for publishing.";
  }

  return {
    structureId: structure.id,
    userId: structure.userId,
    uiState,
    uiLabel: toPublishingStatusLabel(uiState),
    backend: {
      structureStatus: structure.status,
      publicationState: detection.state,
      deploymentStatus: detection.deploymentStatus,
      hasDeletedAt: Boolean(structure.management?.deletedAt),
    },
    detection,
    validation,
    timestamps: {
      lastUpdatedAt: structure.updatedAt,
      lastPublishedAt: detection.lastPublishedAt,
      lastDraftUpdatedAt: detection.lastDraftUpdatedAt,
    },
    hasUnpublishedChanges: detection.hasUnpublishedChanges,
    isTransitional: uiState === "publishing" || uiState === "updating",
    failureMessage: detection.lastError,
    liveUrl: detection.liveUrl,
    action: {
      publishAction,
      publishActionLabel,
      canTriggerPublishAction: !publishDisableReason,
      disableReason: publishDisableReason,
    },
  };
}

export function buildPublishingStatusFromStructure(structure: BuildPublishingStatusModelParams["structure"]): PublishingStatusModel {
  const detection = detectPublicationState(structure);
  const validation = validatePublishEligibility(structure);
  return buildPublishingStatusModel({ structure, detection, validation });
}
