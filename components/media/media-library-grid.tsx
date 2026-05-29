"use client";

import type { MediaApiRecord } from "@/lib/media/types";
import { MediaCard } from "./media-card";

interface MediaLibraryGridProps {
  items: MediaApiRecord[];
  selectedId?: string;
  onSelect?: (media: MediaApiRecord) => void;
}

export function MediaLibraryGrid({ items, selectedId, onSelect }: MediaLibraryGridProps) {
  if (items.length === 0) {
    return <p>No media found.</p>;
  }

  return (
    <div className="media-library-grid" role="list" aria-label="Media library grid">
      {items.map((item) => (
        <MediaCard key={item.id} media={item} selected={item.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
