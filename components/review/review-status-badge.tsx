import type { ReviewState } from "@/lib/review/types";

interface ReviewStatusBadgeProps {
  state: ReviewState;
}

const REVIEW_STATUS_CLASS: Record<ReviewState, string> = {
  pending_review: "review-status-pending_review",
  approved: "review-status-approved",
  rejected: "review-status-rejected",
  needs_changes: "review-status-needs_changes",
  published: "review-status-published",
};

export function ReviewStatusBadge({ state }: ReviewStatusBadgeProps) {
  const label = state.replaceAll("_", " ");
  return (
    <span className={`review-status-badge ${REVIEW_STATUS_CLASS[state]}`} aria-label={`Review status: ${label}`}>
      {label}
    </span>
  );
}
