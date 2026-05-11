"use client";

import { useState } from "react";
import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";

interface UploadResponse {
  ok: boolean;
  item?: WebsiteMediaLibraryApiRecord;
  preview?: { url: string };
  error?: string;
}

interface WebsiteMediaUploadPanelProps {
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  pageId?: string;
  sectionId?: string;
  onUploaded?: (payload: { item: WebsiteMediaLibraryApiRecord; previewUrl?: string }) => void;
}

export function WebsiteMediaUploadPanel({
  websiteId,
  linkedContentId,
  linkedContentType,
  pageId,
  sectionId,
  onUploaded,
}: WebsiteMediaUploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function uploadFile(file: File) {
    setUploading(true);
    setError(undefined);
    setMessage(undefined);

    const formData = new FormData();
    formData.set("file", file);
    if (websiteId) formData.set("websiteId", websiteId);
    if (linkedContentId) formData.set("linkedContentId", linkedContentId);
    if (linkedContentType) formData.set("linkedContentType", linkedContentType);
    if (pageId) formData.set("pageId", pageId);
    if (sectionId) formData.set("sectionId", sectionId);
    if (title.trim()) formData.set("title", title.trim());
    if (altText.trim()) formData.set("altText", altText.trim());
    if (tags.trim()) formData.set("tags", tags.trim());

    try {
      const response = await fetch("/api/website-media-library/upload", { method: "POST", body: formData });
      const body = await response.json() as UploadResponse;
      if (!response.ok || !body.ok || !body.item) {
        setError(body.error || "Upload failed.");
        return;
      }
      setMessage(`Uploaded ${body.item.displayName}`);
      setTitle("");
      setAltText("");
      setTags("");
      onUploaded?.({ item: body.item, previewUrl: body.preview?.url });
    } catch (error) {
      console.error("Website media upload failed", error);
      setError("Upload failed. Check connectivity, file size, and supported file types, then try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="website-media-upload-panel media-upload-panel" aria-label="Website media upload panel">
      <h3>Upload media</h3>
      <label>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional display name" />
      </label>
      <label>
        <span>Alt text</span>
        <input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Optional alt text" />
      </label>
      <label>
        <span>Tags</span>
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Comma-separated tags" />
      </label>
      <label className="media-upload-dropzone">
        <span>{uploading ? "Uploading…" : "Choose a file"}</span>
        <input
          type="file"
          hidden
          disabled={uploading}
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) {
              void uploadFile(file);
            }
            event.currentTarget.value = "";
          }}
        />
      </label>
      {error ? <p className="website-management-error">{error}</p> : null}
      {message ? <p className="website-management-success">{message}</p> : null}
    </section>
  );
}
