"use client";

import type { MediaApiRecord } from "@/lib/media/types";

interface MediaCardProps {
  media: MediaApiRecord;
  selected?: boolean;
  onSelect?: (media: MediaApiRecord) => void;
}

export function MediaCard({ media, selected, onSelect }: MediaCardProps) {
  const canSelect = media.permissions?.read !== false;

  return (
    <article className={`media-card${selected ? " is-selected" : ""}`}>
      <header>
        <h4>{media.originalFilename}</h4>
      </header>
      <p>Type: {media.mediaType}</p>
      <p>MIME: {media.mimeType}</p>
      <p>Size: {Math.round(media.fileSizeBytes / 1024)} KB</p>
      <button type="button" onClick={() => onSelect?.(media)} disabled={!canSelect}>
        {selected ? "Selected" : canSelect ? "Select" : "Unavailable"}
      </button>
    </article>
  );
}
