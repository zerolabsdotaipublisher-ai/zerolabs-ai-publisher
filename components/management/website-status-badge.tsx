import type { WebsiteLifecycleStatus } from "@/lib/management";

interface WebsiteStatusBadgeProps {
  status: WebsiteLifecycleStatus;
}

const STATUS_LABELS: Record<WebsiteLifecycleStatus, string> = {
  draft: "Draft",
  live: "Live",
  unpublished_changes: "Updates pending",
  publishing: "Publishing",
  updating: "Publishing",
  failed: "Failed",
  archived: "Archived",
  deleted: "Deleted",
};

export function WebsiteStatusBadge({ status }: WebsiteStatusBadgeProps) {
  return (
    <span className={`website-status-badge website-status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
