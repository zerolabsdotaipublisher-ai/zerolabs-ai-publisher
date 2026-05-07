import { ApprovalStatusBadge } from "@/components/approval/approval-status-badge";
import { mapReviewStateToApprovalState } from "@/lib/approval/schema";
import type { ReviewState } from "@/lib/review/types";

interface ReviewStatusBadgeProps {
  state: ReviewState;
}

export function ReviewStatusBadge({ state }: ReviewStatusBadgeProps) {
  return <ApprovalStatusBadge state={mapReviewStateToApprovalState(state)} />;
}
