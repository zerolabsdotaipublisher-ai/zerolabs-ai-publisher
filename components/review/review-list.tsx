import Link from "next/link";
import { routes } from "@/config/routes";
import type { ReviewListItem } from "@/lib/review/types";
import { ReviewStatusBadge } from "./review-status-badge";

interface ReviewListProps {
  items: ReviewListItem[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ReviewList({ items }: ReviewListProps) {
  return (
    <section className="review-list" aria-label="AI content review list">
      {items.map((entry) => (
        <article key={entry.contentId} className="review-card" aria-label={`${entry.item.title} review item`}>
          <header className="review-card-header">
            <h3>{entry.item.title}</h3>
            <ReviewStatusBadge state={entry.reviewState} />
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
              <dd>{entry.publishReady ? "Ready" : "Not ready"}</dd>
            </div>
          </dl>

          {entry.reviewNote ? <p className="review-card-note">Feedback: {entry.reviewNote}</p> : null}

          <div className="review-card-actions">
            <Link href={routes.reviewItem(entry.contentId)}>Review</Link>
            {entry.item.quickActions.viewHref ? <Link href={entry.item.quickActions.viewHref}>Preview</Link> : null}
            {entry.item.quickActions.editHref ? <Link href={entry.item.quickActions.editHref}>Edit</Link> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
