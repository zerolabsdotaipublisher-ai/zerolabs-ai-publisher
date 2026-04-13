import type { WebsiteStructure } from "@/lib/ai/structure";

export function buildPreviewStructureFromDraft(draft: WebsiteStructure): WebsiteStructure {
  return draft;
}

export function buildPreviewSyncTimestamp(): string {
  return new Date().toISOString();
}
