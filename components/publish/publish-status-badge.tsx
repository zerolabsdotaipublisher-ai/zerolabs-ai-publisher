import type { PublishingStatusUiState } from "@/lib/publish/status";
import { toPublishingStatusLabel } from "@/lib/publish/status";

interface PublishStatusBadgeProps {
  state: PublishingStatusUiState;
}

export function PublishStatusBadge({ state }: PublishStatusBadgeProps) {
  return <span className={`publish-status-badge publish-status-${state}`}>{toPublishingStatusLabel(state)}</span>;
}
