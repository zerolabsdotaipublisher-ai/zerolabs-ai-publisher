import type { ReviewDetail } from "@/lib/review/types";

interface ReviewMetadataPanelProps {
  detail: ReviewDetail;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ReviewMetadataPanel({ detail }: ReviewMetadataPanelProps) {
  return (
    <aside className="review-metadata-panel" aria-label="Review metadata and context">
      <h2>Metadata</h2>
      <dl>
        <div>
          <dt>Content type</dt>
          <dd>{detail.item.type.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Title</dt>
          <dd>{detail.item.title}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(detail.item.createdAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(detail.item.updatedAt)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{detail.item.status}</dd>
        </div>
        <div>
          <dt>Review state</dt>
          <dd>{detail.reviewState}</dd>
        </div>
        <div>
          <dt>Website</dt>
          <dd>{detail.item.linkedWebsite?.title || "—"}</dd>
        </div>
        <div>
          <dt>Campaign</dt>
          <dd>{detail.item.linkedCampaign || "—"}</dd>
        </div>
        <div>
          <dt>SEO/keywords</dt>
          <dd>{detail.item.keywords.length > 0 ? detail.item.keywords.join(", ") : "—"}</dd>
        </div>
      </dl>

      <section className="review-future-ready">
        <h3>Version comparison</h3>
        <p>{detail.versionComparison.note}</p>
        {detail.versionComparison.href ? <a href={detail.versionComparison.href}>Open existing version history</a> : null}
      </section>

      <section className="review-future-ready">
        <h3>Comments / feedback</h3>
        <p>{detail.commentsFeedback.note}</p>
      </section>
    </aside>
  );
}
