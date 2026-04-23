import type { WebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteDeletionStrategy } from "./types";

export const WEBSITE_DELETION_STRATEGY: WebsiteDeletionStrategy = {
  mode: "soft",
  hardDeleteEnabled: false,
  recoverable: true,
};

export function softDeleteWebsite(structure: WebsiteStructure, userId: string, now: string): WebsiteStructure {
  if (structure.management?.deletedAt) {
    return structure;
  }

  return {
    ...structure,
    status: "deleted",
    updatedAt: now,
    management: {
      ...structure.management,
      deletedAt: now,
      deletedBy: userId,
      deletionState: "deleted",
    },
    publication: structure.publication
      ? {
          ...structure.publication,
          state: "unpublished",
          lastUpdatedAt: now,
        }
      : structure.publication,
  };
}

export function restoreSoftDeletedWebsite(structure: WebsiteStructure, now: string): WebsiteStructure {
  return {
    ...structure,
    status: "draft",
    updatedAt: now,
    management: {
      ...structure.management,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionState: "active",
    },
  };
}
