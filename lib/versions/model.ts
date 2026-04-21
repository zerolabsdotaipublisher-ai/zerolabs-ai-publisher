import type { WebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteVersionSource } from "./types";

export const WEBSITE_VERSION_HISTORY_LIMIT = 30;

function sanitizeLabel(label: string): string {
  const normalized = label.trim().replace(/\s+/g, " ");
  // Keep labels short enough for dense history UIs while preserving meaningful context.
  return normalized.slice(0, 120);
}

export function createWebsiteVersionId(structureId: string, source: WebsiteVersionSource, at: string): string {
  const normalizedTimestamp = at.replace(/[^0-9]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `wver_${structureId}_${source}_${normalizedTimestamp}_${suffix}`;
}

export function createWebsiteVersionLabel(source: WebsiteVersionSource, structure: WebsiteStructure): string {
  switch (source) {
    case "generate":
      return sanitizeLabel(`Initial generated draft for structure v${structure.version}`);
    case "draft_save":
      return sanitizeLabel(`Draft save for structure v${structure.version}`);
    case "publish":
      return sanitizeLabel(`Published live structure v${structure.version}`);
    case "update":
      return sanitizeLabel(`Deployment update for structure v${structure.version}`);
    case "restore":
      return sanitizeLabel(`Restored working draft to structure v${structure.version}`);
    default:
      return sanitizeLabel(`Website version for structure v${structure.version}`);
  }
}

export function clampVersionHistoryLimit(limit?: number): number {
  if (!limit || limit < 1) {
    return WEBSITE_VERSION_HISTORY_LIMIT;
  }

  return Math.min(limit, WEBSITE_VERSION_HISTORY_LIMIT);
}
