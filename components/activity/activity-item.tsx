import Link from "next/link";
import type { PublishingActivityItem, PublishingActivityQuickAction } from "@/lib/activity/types";

interface ActivityItemProps {
  item: PublishingActivityItem;
  actionPendingId?: string;
  onApiAction: (action: PublishingActivityQuickAction) => void;
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function ActivityItem({ item, actionPendingId, onApiAction }: ActivityItemProps) {
  return (
    <article className={`activity-item activity-item-${item.status}`} aria-label={`${item.title} publishing activity`}>
      <header className="activity-item-header">
        <h3>{item.title}</h3>
        <span className={`activity-status activity-status-${item.status}`}>{item.status.replace("_", " ")}</span>
      </header>

      <dl className="activity-meta-grid">
        <div>
          <dt>Event</dt>
          <dd>{item.eventType.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Content type</dt>
          <dd>{item.contentType.replace("_", " ")}</dd>
        </div>
        <div>
          <dt>Platform</dt>
          <dd>{item.platform}</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>{item.account || "—"}</dd>
        </div>
        <div>
          <dt>Occurred</dt>
          <dd>{formatDate(item.occurredAt)}</dd>
        </div>
        <div>
          <dt>Scheduled for</dt>
          <dd>{formatDate(item.scheduledFor)}</dd>
        </div>
      </dl>

      <div className="activity-actions">
        {item.quickActions.map((action) => {
          if (action.kind === "link" && action.href) {
            return (
              <Link key={action.id} href={action.href}>
                {action.label}
              </Link>
            );
          }

          if (action.kind === "api" && action.apiPath) {
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onApiAction(action)}
                disabled={actionPendingId === action.id}
              >
                {actionPendingId === action.id ? "Working..." : action.label}
              </button>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}
