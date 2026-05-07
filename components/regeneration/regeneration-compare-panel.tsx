"use client";

import type { EditableContentDraft } from "@/lib/editing/types";
import type { RegenerationComparisonSummary } from "@/lib/regeneration/types";

interface RegenerationComparePanelProps {
  before: EditableContentDraft;
  after: EditableContentDraft;
  compare: RegenerationComparisonSummary;
}

export function RegenerationComparePanel({ before, after, compare }: RegenerationComparePanelProps) {
  return (
    <section className="regeneration-compare-panel" aria-label="Regeneration comparison">
      <h4>Compare</h4>
      <p>Changed fields: {compare.changedFields.length > 0 ? compare.changedFields.join(", ") : "none"}</p>
      <p>Changed sections: {compare.changedSections}</p>
      <div className="regeneration-compare-grid">
        <article>
          <h5>Before</h5>
          <p><strong>Title:</strong> {before.title}</p>
          <p><strong>Summary:</strong> {before.summary}</p>
        </article>
        <article>
          <h5>After</h5>
          <p><strong>Title:</strong> {after.title}</p>
          <p><strong>Summary:</strong> {after.summary}</p>
        </article>
      </div>
    </section>
  );
}

