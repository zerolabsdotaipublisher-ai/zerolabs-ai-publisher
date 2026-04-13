import type { WebsiteStructure } from "@/lib/ai/structure";

function normalizeForDirtyCheck(structure: WebsiteStructure): unknown {
  return {
    ...structure,
    version: 0,
    updatedAt: "",
  };
}

export function isEditorDirty(original: WebsiteStructure, draft: WebsiteStructure): boolean {
  return JSON.stringify(normalizeForDirtyCheck(original)) !== JSON.stringify(normalizeForDirtyCheck(draft));
}
