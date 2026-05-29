"use client";

import type { SocialPublishHistoryJob } from "@/lib/social/history";

interface SocialHistoryListProps {
  items: SocialPublishHistoryJob[];
  loading?: boolean;
  onRetry: (historyJobId: string) => Promise<void>;
}

export function SocialHistoryList({ items, loading, onRetry }: SocialHistoryListProps) {
  if (items.length === 0) {
    return <p>No social publishing history yet.</p>;
  }

  return (
    <div className="social-history-list">
      {items.map((item) => (
        <article key={item.id} className="social-history-card">
          <header className="social-history-card-header">
            <div>
              <h3>{item.platform} publish</h3>
              <p>{item.contentSnapshot.caption}</p>
            </div>
            <div className="social-schedule-card-badges">
              <span className={`content-schedule-badge content-schedule-status-${item.status}`}>{item.status}</span>
              <span className="content-schedule-badge">{item.source}</span>
            </div>
          </header>

          <div className="social-schedule-card-meta">
            <span>Requested: {new Date(item.createdAt).toLocaleString()}</span>
            <span>Scheduled: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "Now"}</span>
            <span>Account: {item.accountReference.platformAccountId ?? "n/a"}</span>
          </div>

          {item.error ? <p className="content-schedule-error">{item.error.message}</p> : null}

          <div className="content-schedule-actions">
            <button
              type="button"
              className="wizard-button-secondary"
              onClick={() => void onRetry(item.id)}
              disabled={loading || !["failed", "retry"].includes(item.status)}
            >
              Retry
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
