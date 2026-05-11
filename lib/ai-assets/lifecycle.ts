import type { AiAssetStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<AiAssetStatus, AiAssetStatus[]> = {
  generating: ["available", "failed", "deleted"],
  available: ["attached", "published", "archived", "deleted", "failed"],
  attached: ["published", "archived", "deleted"],
  published: ["archived", "deleted"],
  archived: ["available", "deleted"],
  failed: ["generating", "deleted"],
  deleted: [],
};

export function isAiAssetStatus(value: string): value is AiAssetStatus {
  return ["generating", "available", "attached", "published", "archived", "failed", "deleted"].includes(value);
}

export function canTransitionAiAssetStatus(from: AiAssetStatus, to: AiAssetStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
