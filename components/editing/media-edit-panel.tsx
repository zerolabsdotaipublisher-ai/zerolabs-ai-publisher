"use client";

import { useMemo, useState } from "react";
import { MediaSelectorDialog } from "@/components/media/media-selector-dialog";
import { MediaUploadPanel } from "@/components/media/media-upload-panel";
import type { MediaApiRecord } from "@/lib/media/types";

interface MediaEditPanelProps {
  references: string[];
  linkedContentId?: string;
  linkedContentType?: string;
  disabled?: boolean;
  onChange: (references: string[]) => void;
}

function mergeReferences(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming].map((entry) => entry.trim()).filter(Boolean)));
}

export function MediaEditPanel({
  references,
  linkedContentId,
  linkedContentType,
  disabled,
  onChange,
}: MediaEditPanelProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);

  const serialized = useMemo(() => references.join("\n"), [references]);

  async function addMediaReferenceFromRecord(media: MediaApiRecord) {
    const endpoint = `/api/media/${encodeURIComponent(media.id)}/signed-url`;

    try {
      const response = await fetch(endpoint);
      const body = (await response.json()) as { ok: boolean; signed?: { url: string } };
      const reference = body.ok && body.signed?.url ? body.signed.url : endpoint;
      onChange(mergeReferences(references, [reference]));
    } catch {
      onChange(mergeReferences(references, [endpoint]));
    }
  }

  return (
    <section className="content-media-edit-panel" aria-label="Media editing panel">
      <h3>Media references</h3>
      <p>Upload reusable assets and select media from your owner-scoped media library.</p>

      <div className="content-media-edit-actions">
        <button type="button" onClick={() => setSelectorOpen(true)} disabled={disabled}>
          Open media library
        </button>
      </div>

      <MediaUploadPanel
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        onUploaded={(payload) => {
          if (payload.signedUrl) {
            onChange(mergeReferences(references, [payload.signedUrl]));
            return;
          }
          addMediaReferenceFromRecord(payload.media);
        }}
      />

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

      <MediaSelectorDialog
        open={selectorOpen}
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        onClose={() => setSelectorOpen(false)}
        onSelect={(media) => {
          void addMediaReferenceFromRecord(media);
        }}
      />
    </section>
  );
}
