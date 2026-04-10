import "server-only";

import { getWebsiteStructure, type WebsiteStructure } from "@/lib/ai/structure";
import { verifyPreviewShareToken } from "./sharing";

export async function getOwnedPreviewStructure(
  structureId: string,
  userId: string,
): Promise<WebsiteStructure | null> {
  return getWebsiteStructure(structureId, userId);
}

export interface SharedPreviewAccess {
  structure: WebsiteStructure;
  token: string;
  expiresAt: string;
}

export async function resolveSharedPreviewAccess(token: string): Promise<SharedPreviewAccess | null> {
  const payload = verifyPreviewShareToken(token);
  if (!payload) {
    return null;
  }

  const structure = await getWebsiteStructure(payload.sid, payload.uid);
  if (!structure) {
    return null;
  }

  return {
    structure,
    token,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}
