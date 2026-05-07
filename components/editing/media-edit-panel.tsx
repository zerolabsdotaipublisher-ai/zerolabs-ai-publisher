"use client";

interface MediaEditPanelProps {
  references: string[];
  disabled?: boolean;
  onChange: (references: string[]) => void;
}

export function MediaEditPanel({ references, disabled, onChange }: MediaEditPanelProps) {
  const serialized = references.join("\n");

  return (
    <section className="content-media-edit-panel" aria-label="Media editing panel">
      <h3>Media references</h3>
      <p>Replace media URLs/references (MVP-safe, no media library upload flow).</p>
      <textarea
        rows={5}
        value={serialized}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          onChange(next);
        }}
      />
    </section>
  );
}
