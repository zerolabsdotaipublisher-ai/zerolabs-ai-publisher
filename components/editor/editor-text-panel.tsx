"use client";

import { useState } from "react";
import { WebsiteMediaSelectorDialog } from "@/components/website-media-library/website-media-selector-dialog";
import { getEditableSectionTextFields, isContentLinkField, isSafeContentLink } from "@/lib/editor";
import type { EditableTextField } from "@/lib/editor";
import type { WebsiteSection } from "@/lib/ai/structure";

interface EditorTextPanelProps {
  websiteId: string;
  pageId?: string;
  section?: WebsiteSection;
  onChange: (path: string, value: string) => void;
}

type ContentFieldGroup = "content" | "buttons" | "media";

const BUTTON_FIELD_NAMES = new Set([
  "primarycta",
  "secondarycta",
  "ctatext",
  "ctahref",
  "secondaryctatext",
  "secondaryctahref",
]);

const LIST_ITEM_NAMES: Record<string, string> = {
  bullets: "Bullet",
  channels: "Contact channel",
  features: "Feature",
  h3headings: "Subheading",
  items: "Item",
  paragraphs: "Paragraph",
  posts: "Post",
  references: "Reference",
  sections: "Section",
  tags: "Tag",
  takeaways: "Takeaway",
  tiers: "Tier",
  trustindicators: "Trust indicator",
};

function toTitleCase(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function fieldLabel(path: string): string {
  const parts = path.replace(/^content\./, "").split(".");

  return parts
    .map((part, index) => {
      if (/^\d+$/.test(part)) {
        const listName = parts[index - 1]?.toLowerCase();
        const itemName = listName ? LIST_ITEM_NAMES[listName] : "Item";
        return `${itemName} ${Number(part) + 1}`;
      }

      if (LIST_ITEM_NAMES[part.toLowerCase()] && /^\d+$/.test(parts[index + 1] ?? "")) {
        return "";
      }

      return toTitleCase(part);
    })
    .filter(Boolean)
    .join(" / ");
}

function getListItemLabel(path: string): string | undefined {
  const parts = path.replace(/^content\./, "").split(".");
  const index = parts.findIndex((part) => /^\d+$/.test(part));
  if (index < 1) {
    return undefined;
  }

  const listName = parts[index - 1]?.toLowerCase();
  const itemName = listName ? LIST_ITEM_NAMES[listName] : "Item";
  return `${itemName} ${Number(parts[index]) + 1}`;
}

function isButtonField(path: string): boolean {
  const fieldName = path.split(".").at(-1)?.toLowerCase();
  return Boolean(fieldName && BUTTON_FIELD_NAMES.has(fieldName));
}

function isMediaField(path: string): boolean {
  return path.replace(/^content\./, "").startsWith("image.");
}

function supportsMediaLibrary(path: string): boolean {
  return /(^|\.)image\.src$/i.test(path);
}

function usesUrlInput(path: string): boolean {
  return isContentLinkField(path) || supportsMediaLibrary(path);
}

function getFieldGroup(path: string): ContentFieldGroup {
  if (isMediaField(path)) {
    return "media";
  }

  return isButtonField(path) ? "buttons" : "content";
}

function usesTextArea(path: string, value: string): boolean {
  const fieldName = path.split(".").at(-1)?.toLowerCase() ?? "";
  return (
    value.length > 100 ||
    /^(body|calltoaction|conclusion|description|excerpt|helpertext|introduction|legaltext|paragraphs|prompthint|quote|summary|subheadline|subtitle|supportingcopy)$/.test(
      fieldName,
    )
  );
}

interface EditorContentFieldProps {
  field: EditableTextField;
  onChange: (path: string, value: string) => void;
}

/** Reusable canonical-content input used by all selected-section field groups. */
export function EditorContentField({ field, onChange }: EditorContentFieldProps) {
  const [unsafeLinkMessage, setUnsafeLinkMessage] = useState<string>();
  const id = `editor-content-${field.path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
  const linkField = isContentLinkField(field.path);
  const urlField = usesUrlInput(field.path);
  const textArea = usesTextArea(field.path, field.value);
  const longFormTextArea =
    field.value.length > 280 ||
    /(^|\.)(body|calltoaction|conclusion|description|excerpt|introduction|legaltext|paragraphs|quote|summary|supportingcopy)$/.test(
      field.path.toLowerCase(),
    );
  const unsafeSavedValue = linkField && !isSafeContentLink(field.value);
  const errorMessage = unsafeLinkMessage || (unsafeSavedValue ? "Replace this unsafe link before saving." : undefined);
  const listItemLabel = getListItemLabel(field.path);

  function handleChange(value: string) {
    if (linkField && !isSafeContentLink(value)) {
      setUnsafeLinkMessage("Links cannot use javascript:, vbscript:, or data: URLs.");
      return;
    }

    setUnsafeLinkMessage(undefined);
    onChange(field.path, value);
  }

  return (
    <div className={`editor-content-field${longFormTextArea ? " is-long-form" : ""}`}>
      {listItemLabel ? <span className="editor-content-list-item">{listItemLabel}</span> : null}
      <label htmlFor={id}>{fieldLabel(field.path)}</label>
      {textArea ? (
        <textarea
          id={id}
          value={field.value}
          onChange={(event) => handleChange(event.target.value)}
          rows={longFormTextArea ? 7 : 5}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          type={urlField ? "url" : "text"}
          value={field.value}
          onChange={(event) => handleChange(event.target.value)}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
        />
      )}
      {errorMessage ? (
        <p id={`${id}-error`} className="editor-content-field-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

interface EditorContentFieldGroupProps {
  title: string;
  description?: string;
  fields: EditableTextField[];
  onChange: (path: string, value: string) => void;
  onMediaSelect?: (path: string) => void;
}

/** Reusable group shell for selected-section content, CTA, and media controls. */
export function EditorContentFieldGroup({
  title,
  description,
  fields,
  onChange,
  onMediaSelect,
}: EditorContentFieldGroupProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <section
      className="editor-content-group"
      aria-label={title}
      data-editor-content-group={title === "Buttons & links" ? "buttons" : title.toLowerCase()}
    >
      <div className="editor-content-group-heading">
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="editor-content-group-fields">
        {fields.map((field) => (
          <div key={field.path} className="editor-content-group-field">
            <EditorContentField field={field} onChange={onChange} />
            {onMediaSelect && supportsMediaLibrary(field.path) ? (
              <button type="button" className="editor-media-select-button" onClick={() => onMediaSelect(field.path)}>
                Choose from media library
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function sectionName(section: WebsiteSection): string {
  const kind = typeof section.content.kind === "string" ? section.content.kind : undefined;
  return kind ? toTitleCase(kind) : `${toTitleCase(section.type)} section`;
}

export function EditorTextPanel({ websiteId, pageId, section, onChange }: EditorTextPanelProps) {
  const [mediaFieldPath, setMediaFieldPath] = useState<string>();
  const [mediaInsertError, setMediaInsertError] = useState<string>();

  if (!section) {
    return (
      <section className="editor-action-panel editor-content-panel" aria-label="Selected content editor">
        <span className="editor-panel-eyebrow">Content</span>
        <h2>Choose a section</h2>
        <p>Select a section in the left panel or canvas to edit its existing content.</p>
      </section>
    );
  }

  const fields = getEditableSectionTextFields(section);
  const groups: Record<ContentFieldGroup, EditableTextField[]> = {
    content: [],
    buttons: [],
    media: [],
  };

  fields.forEach((field) => groups[getFieldGroup(field.path)].push(field));

  return (
    <section className="editor-action-panel editor-content-panel" aria-label={`Content editor for ${sectionName(section)}`}>
      <div className="editor-action-panel-header">
        <div>
          <span className="editor-panel-eyebrow">Content</span>
          <h2>{sectionName(section)}</h2>
        </div>
      </div>
      <p className="editor-content-panel-description">Changes update this section in the canvas immediately.</p>
      {fields.length === 0 ? <p>No editable content is modeled for this section.</p> : null}
      <EditorContentFieldGroup title="Content" fields={groups.content} onChange={onChange} />
      <EditorContentFieldGroup title="Buttons & links" fields={groups.buttons} onChange={onChange} />
      <EditorContentFieldGroup
        title="Media"
        fields={groups.media}
        onChange={onChange}
        onMediaSelect={(path) => setMediaFieldPath(path)}
      />
      {mediaInsertError ? <p className="website-management-error">{mediaInsertError}</p> : null}
      <WebsiteMediaSelectorDialog
        open={Boolean(mediaFieldPath)}
        websiteId={websiteId}
        linkedContentId={`website:${websiteId}`}
        linkedContentType="website"
        pageId={pageId}
        sectionId={section.id}
        onClose={() => {
          setMediaFieldPath(undefined);
          setMediaInsertError(undefined);
        }}
        onSelect={(payload) => {
          if (!mediaFieldPath) {
            return;
          }
          const selectedUrl = payload.item.assetUrlEndpoint || payload.previewUrl || payload.item.assetRenderEndpoint;
          if (!selectedUrl) {
            setMediaInsertError("The selected website asset URL was not available. Please try selecting the item again.");
            return;
          }
          onChange(mediaFieldPath, selectedUrl);
          setMediaInsertError(undefined);
          setMediaFieldPath(undefined);
        }}
      />
    </section>
  );
}
