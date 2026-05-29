import type { PublishingStatusModel } from "@/lib/publish/status";
import { PublishStatusBadge } from "./publish-status-badge";

interface PublishStatusSummaryProps {
  status: PublishingStatusModel;
  loading?: boolean;
  error?: string;
  compact?: boolean;
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
}

export function PublishStatusSummary({ status, loading = false, error, compact = false }: PublishStatusSummaryProps) {
  return (
    <section className={`publish-status-summary${compact ? " publish-status-summary-compact" : ""}`} aria-live="polite">
      <div className="publish-status-summary-header">
        <PublishStatusBadge state={status.uiState} />
        {loading ? <span className="publish-status-summary-refresh">Refreshing status…</span> : null}
      </div>
      {status.hasUnpublishedChanges ? <p className="publish-status-summary-note">Updates pending for publish.</p> : null}
      {status.failureMessage ? <p className="publish-status-summary-error">{status.failureMessage}</p> : null}
      {error ? <p className="publish-status-summary-error">{error}</p> : null}
      <dl className="publish-status-summary-meta">
        <div>
          <dt>Last updated</dt>
          <dd>{formatTimestamp(status.timestamps.lastUpdatedAt)}</dd>
        </div>
        <div>
          <dt>Last published</dt>
          <dd>{formatTimestamp(status.timestamps.lastPublishedAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
