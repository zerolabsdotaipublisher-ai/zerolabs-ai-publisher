import type { AiAsset } from "./types";

export function resolveOriginalAssetId(asset: AiAsset): string {
  return asset.originalAssetId ?? asset.id;
}

export function createVariantVersion(parent: AiAsset): number {
  return Math.max(1, parent.version + 1);
}
