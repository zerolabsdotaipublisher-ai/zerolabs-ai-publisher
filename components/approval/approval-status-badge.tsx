import type { ApprovalState } from "@/lib/approval";

interface ApprovalStatusBadgeProps {
  state: ApprovalState;
}

const CLASS_BY_STATE: Record<ApprovalState, string> = {
  draft: "review-status-needs_changes",
  pending_approval: "review-status-pending_review",
  approved: "review-status-approved",
  rejected: "review-status-rejected",
  needs_changes: "review-status-needs_changes",
  published: "review-status-published",
};

function labelForState(state: ApprovalState): string {
  if (state === "pending_approval") return "pending approval";
  return state.replaceAll("_", " ");
}

export function ApprovalStatusBadge({ state }: ApprovalStatusBadgeProps) {
  const label = labelForState(state);
  return (
    <span className={`review-status-badge ${CLASS_BY_STATE[state]}`} aria-label={`Approval status: ${label}`}>
      {label}
    </span>
  );
}
