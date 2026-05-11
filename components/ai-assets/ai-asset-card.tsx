"use client";

import { useEffect, useState } from "react";
import type { AiAssetApiRecord } from "@/lib/ai-assets/types";
import { AiAssetStatusBadge } from "./ai-asset-status-badge";

interface AiAssetCardProps {
  asset: AiAssetApiRecord;
  selected?: boolean;
  onSelect?: (asset: AiAssetApiRecord) => void;
}

interface SignedUrlResponse {
  ok: boolean;
  signed?: { url: string };
}

export function AiAssetCard({ asset, selected, onSelect }: AiAssetCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const canPreview = asset.permissions?.preview !== false && asset.permissions?.signedUrl !== false;
  const canSelect = asset.permissions?.read !== false;

  useEffect(() => {
    if (!canPreview) {
      setPreviewUrl(undefined);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch(asset.signedUrlEndpoint);
        const body = await response.json() as SignedUrlResponse;
        if (!cancelled && body.ok) {
          setPreviewUrl(body.signed?.url);
        }
      } catch {
        if (!cancelled) {
          setPreviewUrl(undefined);
        }
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [asset.signedUrlEndpoint, canPreview]);

  return (
    <article className={`media-card ai-asset-card ${selected ? "is-selected" : ""}`}>
      <button type="button" onClick={() => onSelect?.(asset)} disabled={!canSelect}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={`AI generated ${asset.assetType} for ${asset.assetPurpose}`}
            className="media-card-preview"
          />
        ) : (
          <div className="media-card-preview">{canPreview ? "No preview" : "Preview unavailable"}</div>
        )}
      </button>
      <div className="media-card-meta">
        <strong>{asset.assetType}</strong>
        <AiAssetStatusBadge status={asset.status} />
        <small>{asset.mimeType}</small>
        <small>{Math.round(asset.fileSizeBytes / 1024)} KB</small>
      </div>
    </article>
  );
}
