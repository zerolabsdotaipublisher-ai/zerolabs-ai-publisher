import "server-only";

import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteStructure } from "@/lib/ai/structure";

export async function getOwnedPublishStructure(structureId: string, userId: string): Promise<WebsiteStructure | null> {
  const structure = await getWebsiteStructure(structureId, userId);
  if (!structure || structure.management?.deletedAt) {
    return null;
  }

  return structure;
}

export async function savePublishStructure(structure: WebsiteStructure): Promise<WebsiteStructure> {
  return updateWebsiteStructure(structure);
}
