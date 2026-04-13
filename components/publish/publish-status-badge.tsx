import type { PublicationState } from "@/lib/publish";

interface PublishStatusBadgeProps {
  state: PublicationState;
}

const labels: Record<PublicationState, string> = {
  draft: "Draft",
  publishing: "Publishing",
  published: "Published",
  update_pending: "Unpublished changes",
  update_failed: "Update failed",
  unpublished: "Unpublished",
};

export function PublishStatusBadge({ state }: PublishStatusBadgeProps) {
  return <span className={`publish-status-badge publish-status-${state}`}>{labels[state]}</span>;
}
