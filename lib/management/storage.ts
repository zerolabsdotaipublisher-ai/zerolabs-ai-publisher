import {
  getWebsiteStructure,
  listWebsiteStructures,
  updateWebsiteStructure,
  type WebsiteStructure,
} from "@/lib/ai/structure";

export async function listOwnedWebsiteStructures(userId: string): Promise<WebsiteStructure[]> {
  return listWebsiteStructures(userId);
}

export async function getOwnedWebsiteStructure(structureId: string, userId: string): Promise<WebsiteStructure | null> {
  return getWebsiteStructure(structureId, userId);
}

export async function saveOwnedWebsiteStructure(structure: WebsiteStructure): Promise<WebsiteStructure> {
  return updateWebsiteStructure(structure);
}
