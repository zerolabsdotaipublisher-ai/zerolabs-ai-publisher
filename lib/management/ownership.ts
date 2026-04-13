import type { WebsiteOwnershipResult } from "./types";
import { getOwnedWebsiteStructure } from "./storage";

export async function validateWebsiteOwnership(structureId: string, userId: string): Promise<WebsiteOwnershipResult> {
  const website = await getOwnedWebsiteStructure(structureId, userId);
  if (!website) {
    return { owned: false };
  }

  return {
    owned: true,
    website,
  };
}
