"use client";

import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";
import { WebsiteMediaLibraryShell } from "./website-media-library-shell";

interface WebsiteMediaSelectorDialogProps {
  open: boolean;
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  pageId?: string;
  sectionId?: string;
  onClose: () => void;
  onSelect: (payload: { item: WebsiteMediaLibraryApiRecord; previewUrl?: string }) => void;
}

export function WebsiteMediaSelectorDialog({
  open,
  websiteId,
  linkedContentId,
  linkedContentType,
  pageId,
  sectionId,
  onClose,
  onSelect,
}: WebsiteMediaSelectorDialogProps) {
  if (!open) return null;

  return (
    <section className="media-selector-dialog website-media-selector-dialog" role="dialog" aria-modal="true" aria-label="Select website media">
      <header className="media-selector-dialog-header">
        <h3>Select website media</h3>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <WebsiteMediaLibraryShell
        websiteId={websiteId}
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        pageId={pageId}
        sectionId={sectionId}
        selectionMode
        onSelect={(payload) => {
          onSelect(payload);
          onClose();
        }}
      />
    </section>
  );
}
