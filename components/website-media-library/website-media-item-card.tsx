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
  const canRead = item.permissions?.read !== false;
  const canPreview = item.permissions?.preview !== false && item.permissions?.signedUrl !== false;
  const canUpdate = item.permissions?.update !== false;
  const canDelete = item.permissions?.delete !== false;

  useEffect(() => {
    if (!canPreview) {
      return;
    }

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
          setError("Preview could not be loaded.");
        }
      }
    }
    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [item.previewEndpoint, canPreview]);

  async function saveTags() {
    if (!canUpdate) return;
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
      <button type="button" className="website-media-preview-trigger" onClick={() => onPreview(item, previewUrl)} disabled={!canPreview}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={item.altText || item.displayName} className="media-card-preview" />
        ) : (
          <div className="media-card-preview">{canPreview ? "No preview" : "Preview unavailable"}</div>
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
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Comma-separated tags" disabled={!canUpdate} />
        </label>
      ) : null}
      <div className="website-media-item-actions">
        {onSelect ? <button type="button" onClick={() => onSelect(item, previewUrl)} disabled={!canRead}>{selected ? "Selected" : canRead ? "Select" : "Unavailable"}</button> : null}
        <button type="button" className="wizard-button-secondary" onClick={() => onPreview(item, previewUrl)} disabled={!canPreview}>Preview</button>
        {!compact ? (
          <button type="button" className="wizard-button-secondary" onClick={() => void saveTags()} disabled={saving || !canUpdate}>
            {saving ? "Saving…" : "Save tags"}
          </button>
        ) : null}
        {onDelete && canDelete ? <button type="button" onClick={() => onDelete(item)}>Delete</button> : null}
      </div>
      {error ? <p className="website-management-error">{error}</p> : null}
    </article>
  );
}
