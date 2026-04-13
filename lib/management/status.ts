import type { WebsiteStructure } from "@/lib/ai/structure";
import { markDraftUpdatedForPublication } from "@/lib/publish";

export function archiveWebsite(structure: WebsiteStructure, now: string): WebsiteStructure {
  return {
    ...structure,
    status: "archived",
    updatedAt: now,
    management: {
      ...structure.management,
      deletionState: structure.management?.deletedAt ? "deleted" : "active",
    },
  };
}

export function activateWebsite(structure: WebsiteStructure, now: string): WebsiteStructure {
  if (structure.management?.deletedAt) {
    return structure;
  }

  const resetStatus: WebsiteStructure = {
    ...structure,
    status: "draft",
    updatedAt: now,
  };

  return markDraftUpdatedForPublication(resetStatus, now);
}
