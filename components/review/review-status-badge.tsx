import type { ReviewState } from "@/lib/review/types";

interface ReviewStatusBadgeProps {
  state: ReviewState;
}

export function ReviewStatusBadge({ state }: ReviewStatusBadgeProps) {
  return <span className={`review-status-badge review-status-${state}`}>{state.replaceAll("_", " ")}</span>;
}
