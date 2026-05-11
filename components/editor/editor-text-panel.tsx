import { useState } from "react";
import { WebsiteMediaSelectorDialog } from "@/components/website-media-library/website-media-selector-dialog";
import { getEditableSectionTextFields } from "@/lib/editor";
import type { WebsiteSection } from "@/lib/ai/structure";

interface EditorTextPanelProps {
  websiteId: string;
  pageId?: string;
  section?: WebsiteSection;
  onChange: (path: string, value: string) => void;
}

function supportsMediaLibrary(path: string): boolean {
  return path.endsWith("image.src") || path.includes(".image.src");
}

export function EditorTextPanel({ websiteId, pageId, section, onChange }: EditorTextPanelProps) {
  const [mediaFieldPath, setMediaFieldPath] = useState<string>();
  const [mediaInsertError, setMediaInsertError] = useState<string>();

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
            {supportsMediaLibrary(field.path) ? (
              <button type="button" className="wizard-button-secondary" onClick={() => setMediaFieldPath(field.path)}>
                Select from website media library
              </button>
            ) : null}
          </label>
        ))}
      </div>
      {mediaInsertError ? <p className="website-management-error">{mediaInsertError}</p> : null}
      <WebsiteMediaSelectorDialog
        open={Boolean(mediaFieldPath)}
        websiteId={websiteId}
        linkedContentId={`website:${websiteId}`}
        linkedContentType="website"
        pageId={pageId}
        sectionId={section?.id}
        onClose={() => {
          setMediaFieldPath(undefined);
          setMediaInsertError(undefined);
        }}
        onSelect={(payload) => {
          if (!mediaFieldPath) {
            return;
          }
          if (!payload.previewUrl) {
            setMediaInsertError("The selected media preview URL was not available. Please try selecting the item again.");
            return;
          }
          onChange(mediaFieldPath, payload.previewUrl);
          setMediaInsertError(undefined);
          setMediaFieldPath(undefined);
        }}
      />
    </section>
  );
}
