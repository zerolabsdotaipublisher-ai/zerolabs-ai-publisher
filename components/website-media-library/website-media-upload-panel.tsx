"use client";

import { useMemo, useState } from "react";
import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";
import { buildFileUploadAssociations } from "@/lib/file-upload/associations";
import { FileUploadPanel } from "@/components/file-upload/file-upload-panel";

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
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");

  const associations = useMemo(
    () => buildFileUploadAssociations({
      source: "website_editing",
      linkedContentId,
      linkedContentType,
      websiteId,
      pageId,
      sectionId,
      metadata: { surface: "website-media-upload-panel" },
    }),
    [linkedContentId, linkedContentType, pageId, sectionId, websiteId],
  );

  return (
    <section className="website-media-upload-panel media-upload-panel" aria-label="Website media upload panel">
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
      <FileUploadPanel
        endpoint="/api/website-media-library/upload"
        source="website_editing"
        multiple={false}
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        usageContext="library"
        associations={associations}
        permissionResourceType="website_media"
        permissionWebsiteId={websiteId}
        metadata={{
          surface: "website-media-upload-panel",
          websiteId,
          pageId,
          sectionId,
        }}
        title="Upload website media"
        description="Add files to the website media library for editing, publishing, and reuse."
        buildFormData={(formData) => {
          if (websiteId) formData.set("websiteId", websiteId);
          if (pageId) formData.set("pageId", pageId);
          if (sectionId) formData.set("sectionId", sectionId);
          if (title.trim()) formData.set("title", title.trim());
          if (altText.trim()) formData.set("altText", altText.trim());
          if (tags.trim()) formData.set("tags", tags.trim());
        }}
        onUploaded={(payload) => {
          const body = payload as UploadResponse;
          if (!body.item) return;
          setTitle("");
          setAltText("");
          setTags("");
          onUploaded?.({ item: body.item, previewUrl: body.preview?.url });
        }}
      />
    </section>
  );
}
