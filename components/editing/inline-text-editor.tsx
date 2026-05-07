"use client";

import { RichTextControls } from "./rich-text-controls";

interface InlineTextEditorProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function applyFormat(value: string, mode: "bold" | "italic" | "heading" | "list" | "link"): string {
  if (!value.trim()) {
    return value;
  }

  if (mode === "bold") {
    return `**${value}**`;
  }

  if (mode === "italic") {
    return `*${value}*`;
  }

  if (mode === "heading") {
    return `## ${value}`;
  }

  if (mode === "list") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line}`)
      .join("\n");
  }

  return `[${value}](https://example.com)`;
}

export function InlineTextEditor({ label, value, disabled, onChange }: InlineTextEditorProps) {
  return (
    <section className="content-inline-text-editor" aria-label={label}>
      <div className="content-inline-text-header">
        <h3>{label}</h3>
        <RichTextControls disabled={disabled} onApply={(mode) => onChange(applyFormat(value, mode))} />
      </div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={6} disabled={disabled} />
    </section>
  );
}
