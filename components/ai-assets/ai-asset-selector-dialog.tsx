"use client";

import { AiAssetLibraryShell } from "./ai-asset-library-shell";
import type { AiAssetApiRecord } from "@/lib/ai-assets/types";

interface AiAssetSelectorDialogProps {
  open: boolean;
  linkedContentId?: string;
  linkedContentType?: string;
  onClose: () => void;
  onSelect: (asset: AiAssetApiRecord) => void;
}

export function AiAssetSelectorDialog({
  open,
  linkedContentId,
  linkedContentType,
  onClose,
  onSelect,
}: AiAssetSelectorDialogProps) {
  if (!open) return null;

  return (
    <div className="media-selector-dialog ai-asset-selector-dialog" role="dialog" aria-modal="true">
      <header className="media-selector-dialog-header">
        <h2>Select AI asset</h2>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <AiAssetLibraryShell
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        onSelect={(asset) => {
          onSelect(asset);
          onClose();
        }}
      />
    </div>
  );
}
