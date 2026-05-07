"use client";

import type { EditingSectionBlock } from "@/lib/editing/types";

interface SectionBlockEditorProps {
  sections: EditingSectionBlock[];
  disabled?: boolean;
  onChange: (sections: EditingSectionBlock[]) => void;
}

export function SectionBlockEditor({ sections, disabled, onChange }: SectionBlockEditorProps) {
  function updateSection(index: number, updates: Partial<EditingSectionBlock>) {
    const next = sections.map((section, currentIndex) => (currentIndex === index ? { ...section, ...updates } : section));
    onChange(next);
  }

  return (
    <section className="content-section-block-editor" aria-label="Section and block editor">
      <h3>Sections and blocks</h3>
      {sections.map((section, index) => (
        <article key={section.id} className="content-section-block-card">
          <label>
            Heading
            <input
              value={section.heading}
              onChange={(event) => updateSection(index, { heading: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label>
            Body
            <textarea
              value={section.body}
              rows={6}
              onChange={(event) => updateSection(index, { body: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label>
            Raw section JSON
            <textarea
              value={section.rawJson || ""}
              rows={5}
              onChange={(event) => updateSection(index, { rawJson: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label>
            Media URL
            <input
              value={section.mediaUrl || ""}
              onChange={(event) => updateSection(index, { mediaUrl: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="content-section-visibility-toggle">
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(event) => updateSection(index, { visible: event.target.checked })}
              disabled={disabled}
            />
            Visible
          </label>
        </article>
      ))}
    </section>
  );
}
