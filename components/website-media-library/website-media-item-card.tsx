"use client";

import { useEffect, useState } from "react";
import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";

interface PreviewResponse {
  ok: boolean;
  preview?: { url: string };
}

interface TagUpdateResponse {
  ok: boolean;
  item?: WebsiteMediaLibraryApiRecord;
  error?: string;
}

interface WebsiteMediaItemCardProps {
  item: WebsiteMediaLibraryApiRecord;
  selected?: boolean;
  compact?: boolean;
  onPreview: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onSelect?: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onDelete?: (item: WebsiteMediaLibraryApiRecord) => void;
  onUpdated?: (item: WebsiteMediaLibraryApiRecord) => void;
}

export function WebsiteMediaItemCard({ item, selected, compact = false, onPreview, onSelect, onDelete, onUpdated }: WebsiteMediaItemCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [tags, setTags] = useState(item.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      try {
        const response = await fetch(item.previewEndpoint);
        const body = await response.json() as PreviewResponse;
        if (!cancelled && body.ok) {
          setPreviewUrl(body.preview?.url);
        }
      } catch {
        if (!cancelled) {
          setPreviewUrl(undefined);
          setError("Preview unavailable until the signed preview request succeeds.");
        }
      }
    }
    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [item.previewEndpoint]);

  async function saveTags() {
    setSaving(true);
    setError(undefined);
    try {
      const response = await fetch(item.tagsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tags.split(",").map((entry) => entry.trim()).filter(Boolean) }),
      });
      const body = await response.json() as TagUpdateResponse;
      if (!response.ok || !body.ok || !body.item) {
        setError(body.error || "Unable to save tags.");
        return;
      }
      setTags(body.item.tags.join(", "));
      onUpdated?.(body.item);
    } catch {
      setError("Unable to save tags because the request did not complete. Retry the update.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`media-card website-media-item-card ${selected ? "is-selected" : ""}`}>
      <button type="button" className="website-media-preview-trigger" onClick={() => onPreview(item, previewUrl)}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={item.altText || item.displayName} className="media-card-preview" />
        ) : (
          <div className="media-card-preview">No preview</div>
        )}
      </button>
      <div className="media-card-meta">
        <strong>{item.displayName}</strong>
        <small>{item.mediaType}</small>
        <small>{item.mimeType}</small>
        <small>{Math.round(item.fileSizeBytes / 1024)} KB</small>
        <small>Usage: {item.usageCount}</small>
        <small>Status: {item.status}</small>
      </div>
      {!compact ? (
        <label className="website-media-tags-editor">
          <span>Tags</span>
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Comma-separated tags" />
        </label>
      ) : null}
      <div className="website-media-item-actions">
        {onSelect ? <button type="button" onClick={() => onSelect(item, previewUrl)}>{selected ? "Selected" : "Select"}</button> : null}
        <button type="button" className="wizard-button-secondary" onClick={() => onPreview(item, previewUrl)}>Preview</button>
        {!compact ? (
          <button type="button" className="wizard-button-secondary" onClick={() => void saveTags()} disabled={saving}>
            {saving ? "Saving…" : "Save tags"}
          </button>
        ) : null}
        {onDelete ? <button type="button" onClick={() => onDelete(item)}>Delete</button> : null}
      </div>
      {error ? <p className="website-management-error">{error}</p> : null}
    </article>
  );
}
