"use client";

interface RichTextControlsProps {
  disabled?: boolean;
  onApply: (mode: "bold" | "italic" | "heading" | "list" | "link") => void;
}

export function RichTextControls({ disabled, onApply }: RichTextControlsProps) {
  return (
    <div className="content-editor-rich-text-controls" aria-label="Rich text controls">
      <button type="button" onClick={() => onApply("bold")} disabled={disabled}>Bold</button>
      <button type="button" onClick={() => onApply("italic")} disabled={disabled}>Italic</button>
      <button type="button" onClick={() => onApply("heading")} disabled={disabled}>Heading</button>
      <button type="button" onClick={() => onApply("list")} disabled={disabled}>List</button>
      <button type="button" onClick={() => onApply("link")} disabled={disabled}>Link</button>
    </div>
  );
}
