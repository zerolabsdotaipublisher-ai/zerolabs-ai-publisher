"use client";

import type { AiAssetApiRecord } from "@/lib/ai-assets/types";
import { AiAssetCard } from "./ai-asset-card";

interface AiAssetGridProps {
  items: AiAssetApiRecord[];
  selectedId?: string;
  onSelect?: (asset: AiAssetApiRecord) => void;
}

export function AiAssetGrid({ items, selectedId, onSelect }: AiAssetGridProps) {
  if (items.length === 0) {
    return <p>No AI assets found.</p>;
  }

  return (
    <div className="media-library-grid ai-asset-grid">
      {items.map((asset) => (
        <AiAssetCard key={asset.id} asset={asset} selected={selectedId === asset.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
