import type { WebsiteLifecycleStatus } from "@/lib/management";

interface WebsiteStatusBadgeProps {
  status: WebsiteLifecycleStatus;
}

const STATUS_LABELS: Record<WebsiteLifecycleStatus, string> = {
  draft: "Draft",
  published: "Published",
  update_pending: "Update pending",
  publishing: "Publishing",
  update_failed: "Update failed",
  unpublished: "Unpublished",
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
