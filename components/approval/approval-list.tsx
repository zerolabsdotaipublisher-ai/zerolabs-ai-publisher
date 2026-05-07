import Link from "next/link";
import { routes } from "@/config/routes";
import type { ApprovalListItem } from "@/lib/approval/types";
import { ApprovalStatusBadge } from "./approval-status-badge";

interface ApprovalListProps {
  items: ApprovalListItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ApprovalList({ items }: ApprovalListProps) {
  return (
    <section className="review-list" aria-label="AI content approval list">
      {items.map((entry) => (
        <article key={entry.contentId} className="review-card" aria-label={`${entry.item.title} approval item`}>
          <header className="review-card-header">
            <h3>{entry.item.title}</h3>
            <ApprovalStatusBadge state={entry.approvalState} />
          </header>

          <dl className="review-card-meta">
            <div>
              <dt>Type</dt>
              <dd>{entry.item.type.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(entry.item.updatedAt)}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{entry.item.linkedWebsite?.title || "—"}</dd>
            </div>
            <div>
              <dt>Publish readiness</dt>
              <dd>{entry.publishReady ? "Ready" : "Blocked"}</dd>
            </div>
          </dl>

          <div className="review-card-actions">
            <Link href={routes.approvalItem(entry.contentId)}>Open approval</Link>
            <Link href={routes.reviewItem(entry.contentId)}>Open review</Link>
            {entry.item.quickActions.editHref ? <Link href={entry.item.quickActions.editHref}>Edit</Link> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
