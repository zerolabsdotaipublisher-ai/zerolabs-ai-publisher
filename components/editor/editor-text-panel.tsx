import { getEditableSectionTextFields } from "@/lib/editor";
import type { WebsiteSection } from "@/lib/ai/structure";

interface EditorTextPanelProps {
  section?: WebsiteSection;
  onChange: (path: string, value: string) => void;
}

export function EditorTextPanel({ section, onChange }: EditorTextPanelProps) {
  if (!section) {
    return (
      <section className="editor-panel">
        <h3>Text content</h3>
        <p>Select a section to edit text content.</p>
      </section>
    );
  }

  const fields = getEditableSectionTextFields(section);

  return (
    <section className="editor-panel">
      <h3>Text content</h3>
      {fields.length === 0 ? <p>No editable text fields for this section.</p> : null}
      <div className="editor-panel-fields">
        {fields.map((field) => (
          <label key={field.path}>
            <span>{field.label}</span>
            <textarea
              value={field.value}
              onChange={(event) => onChange(field.path, event.target.value)}
              rows={3}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
