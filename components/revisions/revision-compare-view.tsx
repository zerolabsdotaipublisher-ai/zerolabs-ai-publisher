"use client";

import type { RevisionCompareResult } from "@/lib/revisions/types";

interface RevisionCompareViewProps {
  loading: boolean;
  error?: string;
  comparison?: RevisionCompareResult;
  onCompare: () => void;
  canCompare: boolean;
}

export function RevisionCompareView({ loading, error, comparison, onCompare, canCompare }: RevisionCompareViewProps) {
  return (
    <section aria-label="Revision compare view">
      <h2>Compare revisions</h2>
      <button type="button" onClick={onCompare} disabled={!canCompare || loading}>
        {loading ? "Comparing..." : "Run compare"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {comparison ? (
        <div>
          <p>{comparison.summary}</p>
          <p>Changed fields: {comparison.changedFields.length ? comparison.changedFields.join(", ") : "none"}</p>
          <p>Changed sections: {comparison.changedSections}</p>
          <p>Keyword delta: {comparison.keywordDelta}</p>
        </div>
      ) : null}
    </section>
  );
}
