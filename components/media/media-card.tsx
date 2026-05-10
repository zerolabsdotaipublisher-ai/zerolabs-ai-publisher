"use client";

import type { MediaApiRecord } from "@/lib/media/types";

interface MediaCardProps {
  media: MediaApiRecord;
  selected?: boolean;
  onSelect?: (media: MediaApiRecord) => void;
}

export function MediaCard({ media, selected, onSelect }: MediaCardProps) {
  return (
    <article className={`media-card${selected ? " is-selected" : ""}`}>
      <header>
        <h4>{media.originalFilename}</h4>
      </header>
      <p>Type: {media.mediaType}</p>
      <p>MIME: {media.mimeType}</p>
      <p>Size: {Math.round(media.fileSizeBytes / 1024)} KB</p>
      <button type="button" onClick={() => onSelect?.(media)}>
        {selected ? "Selected" : "Select"}
      </button>
    </article>
  );
}
