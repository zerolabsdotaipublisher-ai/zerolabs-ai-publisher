"use client";

import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";
import { WebsiteMediaItemCard } from "./website-media-item-card";

interface WebsiteMediaLibraryGridProps {
  items: WebsiteMediaLibraryApiRecord[];
  selectedId?: string;
  compact?: boolean;
  onPreview: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onSelect?: (item: WebsiteMediaLibraryApiRecord, previewUrl?: string) => void;
  onDelete?: (item: WebsiteMediaLibraryApiRecord) => void;
  onUpdated?: (item: WebsiteMediaLibraryApiRecord) => void;
}

export function WebsiteMediaLibraryGrid({ items, selectedId, compact, onPreview, onSelect, onDelete, onUpdated }: WebsiteMediaLibraryGridProps) {
  return (
    <div className="media-library-grid website-media-library-grid" role="list" aria-label="Website media library grid">
      {items.map((item) => (
        <WebsiteMediaItemCard
          key={item.id}
          item={item}
          compact={compact}
          selected={item.id === selectedId}
          onPreview={onPreview}
          onSelect={onSelect}
          onDelete={onDelete}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
