"use client";

import type { MediaApiRecord } from "@/lib/media/types";
import { MediaLibraryShell } from "./media-library-shell";

interface MediaSelectorDialogProps {
  open: boolean;
  linkedContentId?: string;
  linkedContentType?: string;
  onClose: () => void;
  onSelect: (media: MediaApiRecord) => void;
}

export function MediaSelectorDialog({
  open,
  linkedContentId,
  linkedContentType,
  onClose,
  onSelect,
}: MediaSelectorDialogProps) {
  if (!open) return null;

  return (
    <section className="media-selector-dialog" role="dialog" aria-modal="true" aria-label="Select media">
      <header className="media-selector-dialog-header">
        <h3>Select media</h3>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <MediaLibraryShell
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        onSelect={(media) => {
          onSelect(media);
          onClose();
        }}
      />
    </section>
  );
}
