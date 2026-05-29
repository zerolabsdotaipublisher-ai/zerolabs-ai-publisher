import type { BuildPublishingStatusModelParams, PublishingStatusUiState } from "./types";

export const PUBLISHING_STATUS_LABELS: Record<PublishingStatusUiState, string> = {
  draft: "Draft",
  publishing: "Publishing",
  updating: "Publishing",
  live: "Live",
  unpublished_changes: "Updates pending",
  failed: "Failed",
  archived: "Archived",
  deleted: "Deleted",
};

export function mapBackendStatusToUiState({
  structure,
  detection,
}: Pick<BuildPublishingStatusModelParams, "structure" | "detection">): PublishingStatusUiState {
  const isDeleted = Boolean(structure.management?.deletedAt || structure.status === "deleted");
  if (isDeleted) {
    return "deleted";
  }

  if (structure.status === "archived") {
    return "archived";
  }

  if (detection.state === "update_failed") {
    return "failed";
  }

  if (detection.state === "publishing") {
    return detection.deploymentStatus === "updating" ? "updating" : "publishing";
  }

  if (detection.state === "update_pending") {
    return "unpublished_changes";
  }

  if (detection.state === "published") {
    return "live";
  }

  return "draft";
}

export function toPublishingStatusLabel(state: PublishingStatusUiState): string {
  return PUBLISHING_STATUS_LABELS[state];
}
