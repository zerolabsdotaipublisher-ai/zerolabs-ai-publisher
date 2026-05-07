import Link from "next/link";
import { routes } from "@/config/routes";
import type { ContentLibraryItem } from "@/lib/content/library/types";

interface ContentLibraryCardProps {
  item: ContentLibraryItem;
  deleting: boolean;
  onDelete: (item: ContentLibraryItem) => void;
}

const MAX_VISIBLE_KEYWORDS = 8;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function ContentLibraryCard({ item, deleting, onDelete }: ContentLibraryCardProps) {
  return (
    <article className="content-library-card" aria-label={`${item.title} content item`}>
      <header className="content-library-card-header">
        <h3>{item.title}</h3>
        <span className={`content-library-status content-library-status-${item.status}`}>{item.status}</span>
      </header>

      <dl className="content-library-meta-grid">
        <div>
          <dt>Type</dt>
          <dd>{item.type.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(item.createdAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
        <div>
          <dt>Linked website</dt>
          <dd>{item.linkedWebsite?.title || "—"}</dd>
        </div>
        <div>
          <dt>Campaign</dt>
          <dd>{item.linkedCampaign || "—"}</dd>
        </div>
        <div>
          <dt>SEO metadata</dt>
          <dd>{item.hasLinkedSeoMetadata ? "Linked" : "—"}</dd>
        </div>
      </dl>

      {item.keywords.length > 0 ? (
        <p className="content-library-keywords">
          Keywords: {item.keywords.slice(0, MAX_VISIBLE_KEYWORDS).join(", ")}
        </p>
      ) : null}

      <div className="content-library-actions">
        <Link href={routes.reviewItem(item.id)}>Review</Link>
        {item.quickActions.viewHref ? <Link href={item.quickActions.viewHref}>View / preview</Link> : null}
        {item.quickActions.editHref ? <Link href={item.quickActions.editHref}>Edit</Link> : null}
        {item.quickActions.publishScheduleHref ? <Link href={item.quickActions.publishScheduleHref}>Publish / schedule</Link> : null}
        {item.quickActions.canDelete && item.quickActions.deleteStructureId ? (
          <button type="button" onClick={() => onDelete(item)} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
