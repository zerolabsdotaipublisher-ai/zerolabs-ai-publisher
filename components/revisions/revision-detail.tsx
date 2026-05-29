"use client";

import type { ContentRevisionRecord } from "@/lib/revisions/types";

interface RevisionDetailProps {
  revision?: ContentRevisionRecord;
}

export function RevisionDetail({ revision }: RevisionDetailProps) {
  if (!revision) {
    return (
      <section aria-label="Revision detail">
        <h2>Revision details</h2>
        <p>Select a revision to inspect snapshot metadata.</p>
      </section>
    );
  }

  return (
    <section aria-label="Revision detail">
      <h2>Revision details</h2>
      <dl>
        <div>
          <dt>Version</dt>
          <dd>{revision.versionNumber}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{revision.actionType.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Title</dt>
          <dd>{revision.summary.title}</dd>
        </div>
        <div>
          <dt>Sections</dt>
          <dd>{revision.summary.sectionCount}</dd>
        </div>
        <div>
          <dt>Words</dt>
          <dd>{revision.summary.wordCount}</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{revision.summary.reviewState}</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{revision.summary.approvalState}</dd>
        </div>
      </dl>
      <p>{revision.changeSummary}</p>
    </section>
  );
}
