import type { PublicationState } from "./types";

const allowedTransitions: Record<PublicationState, PublicationState[]> = {
  draft: ["publishing", "unpublished"],
  publishing: ["published", "update_failed"],
  published: ["update_pending", "publishing", "unpublished"],
  update_pending: ["publishing", "update_failed", "unpublished"],
  update_failed: ["publishing", "update_pending", "unpublished"],
  unpublished: ["publishing", "draft"],
};

export function canTransitionPublicationState(
  current: PublicationState,
  next: PublicationState,
): boolean {
  return current === next || allowedTransitions[current].includes(next);
}
