"use client";

import type { ContentRevisionRecord } from "@/lib/revisions/types";

interface RevisionListProps {
  entries: ContentRevisionRecord[];
  selectedRevisionId?: string;
  compareLeftId?: string;
  compareRightId?: string;
  onSelect: (revisionId: string) => void;
  onToggleCompareLeft: (revisionId: string) => void;
  onToggleCompareRight: (revisionId: string) => void;
  onRestore: (revisionId: string) => void;
  restoringRevisionId?: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function RevisionList({
  entries,
  selectedRevisionId,
  compareLeftId,
  compareRightId,
  onSelect,
  onToggleCompareLeft,
  onToggleCompareRight,
  onRestore,
  restoringRevisionId,
}: RevisionListProps) {
  return (
    <section aria-label="Revision list">
      <h2>Revisions</h2>
      {entries.length === 0 ? <p>No revisions recorded yet.</p> : null}
      <div className="version-history-list">
        {entries.map((entry) => (
          <article key={entry.id} className="version-history-item">
            <div className="version-history-item-header">
              <strong>v{entry.versionNumber}</strong>
              <span>{entry.changeSummary}</span>
            </div>
            <div className="version-history-item-meta">
              <span>{entry.actionType.replaceAll("_", " ")}</span>
              <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
            </div>
            <div className="version-history-item-actions">
              <button type="button" onClick={() => onSelect(entry.id)} disabled={selectedRevisionId === entry.id}>
                {selectedRevisionId === entry.id ? "Selected" : "View details"}
              </button>
              <button type="button" onClick={() => onToggleCompareLeft(entry.id)}>
                {compareLeftId === entry.id ? "Compared as A" : "Set as compare A"}
              </button>
              <button type="button" onClick={() => onToggleCompareRight(entry.id)}>
                {compareRightId === entry.id ? "Compared as B" : "Set as compare B"}
              </button>
              <button type="button" onClick={() => onRestore(entry.id)} disabled={restoringRevisionId === entry.id}>
                {restoringRevisionId === entry.id ? "Restoring..." : "Restore"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
