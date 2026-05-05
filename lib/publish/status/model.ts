import { detectPublicationState } from "@/lib/publish/detection";
import { validatePublishEligibility } from "@/lib/publish/validation";
import type { BuildPublishingStatusModelParams, PublishingStatusModel } from "./types";
import { mapBackendStatusToUiState, toPublishingStatusLabel } from "./mapping";

export function buildPublishingStatusModel({
  structure,
  detection,
  validation,
}: BuildPublishingStatusModelParams): PublishingStatusModel {
  const uiState = mapBackendStatusToUiState({ structure, detection });
  const publishAction = detection.neverPublished ? "publish" : "update";
  const publishActionLabel = detection.neverPublished
    ? "Publish website"
    : detection.hasUnpublishedChanges
      ? "Publish updates"
      : "Update live website";

  let disableReason: string | undefined;
  if (uiState === "deleted") {
    disableReason = "Deleted websites cannot be published.";
  } else if (uiState === "archived") {
    disableReason = "Archived websites cannot be published.";
  } else if (uiState === "publishing" || uiState === "updating") {
    disableReason = "A publish operation is already in progress.";
  } else if (!validation.eligible) {
    disableReason = "This website is not eligible for publishing.";
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
      canTriggerPublishAction: !disableReason,
      disableReason,
    },
  };
}

export function buildPublishingStatusFromStructure(structure: BuildPublishingStatusModelParams["structure"]): PublishingStatusModel {
  const detection = detectPublicationState(structure);
  const validation = validatePublishEligibility(structure);
  return buildPublishingStatusModel({ structure, detection, validation });
}
