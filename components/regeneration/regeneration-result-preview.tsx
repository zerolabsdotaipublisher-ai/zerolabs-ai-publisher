"use client";

import type { EditableContentDraft } from "@/lib/editing/types";

interface RegenerationResultPreviewProps {
  draft: EditableContentDraft;
}

export function RegenerationResultPreview({ draft }: RegenerationResultPreviewProps) {
  return (
    <section className="regeneration-result-preview" aria-label="Regenerated draft preview">
      <h4>Regenerated preview</h4>
      <p><strong>Title:</strong> {draft.title}</p>
      <p><strong>Summary:</strong> {draft.summary}</p>
      <p><strong>Sections:</strong> {draft.sections.length}</p>
    </section>
  );
}

