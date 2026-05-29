"use client";

import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";
import { WebsiteMediaItemCard } from "./website-media-item-card";

interface WebsiteMediaLibraryListProps {
  items: WebsiteMediaLibraryApiRecord[];
  selectedId?: string;
  onPreview: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onSelect?: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onDelete?: (item: WebsiteMediaLibraryApiRecord) => void;
  onUpdated?: (item: WebsiteMediaLibraryApiRecord) => void;
}

export function WebsiteMediaLibraryList({ items, selectedId, onPreview, onSelect, onDelete, onUpdated }: WebsiteMediaLibraryListProps) {
  return (
    <div className="website-media-library-list" role="list" aria-label="Website media library list">
      {items.map((item) => (
        <WebsiteMediaItemCard
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          compact
          onPreview={onPreview}
          onSelect={onSelect}
          onDelete={onDelete}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
