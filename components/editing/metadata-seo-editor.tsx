"use client";

import type { EditingMetadataSeo } from "@/lib/editing/types";

interface MetadataSeoEditorProps {
  metadataSeo: EditingMetadataSeo;
  disabled?: boolean;
  onChange: (metadataSeo: EditingMetadataSeo) => void;
}

export function MetadataSeoEditor({ metadataSeo, disabled, onChange }: MetadataSeoEditorProps) {
  return (
    <section className="content-metadata-seo-editor" aria-label="Metadata and SEO editor">
      <h3>Metadata and SEO</h3>
      <label>
        Slug
        <input
          value={metadataSeo.slug || ""}
          onChange={(event) => onChange({ ...metadataSeo, slug: event.target.value })}
          disabled={disabled}
        />
      </label>
      <label>
        Meta title
        <input
          value={metadataSeo.metaTitle}
          onChange={(event) => onChange({ ...metadataSeo, metaTitle: event.target.value })}
          disabled={disabled}
        />
      </label>
      <label>
        Meta description
        <textarea
          value={metadataSeo.metaDescription}
          rows={4}
          onChange={(event) => onChange({ ...metadataSeo, metaDescription: event.target.value })}
          disabled={disabled}
        />
      </label>
      <label>
        Canonical URL/path
        <input
          value={metadataSeo.canonicalUrl || ""}
          onChange={(event) => onChange({ ...metadataSeo, canonicalUrl: event.target.value })}
          disabled={disabled}
        />
      </label>
      <label>
        Keywords (comma separated)
        <input
          value={metadataSeo.keywords.join(", ")}
          onChange={(event) => onChange({
            ...metadataSeo,
            keywords: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean),
          })}
          disabled={disabled}
        />
      </label>
      <label>
        Tags (comma separated)
        <input
          value={metadataSeo.tags.join(", ")}
          onChange={(event) => onChange({
            ...metadataSeo,
            tags: event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean),
          })}
          disabled={disabled}
        />
      </label>
    </section>
  );
}
