import "server-only";

import { getWebsiteStructure, type WebsiteStructure } from "@/lib/ai/structure";
import { verifyPreviewShareToken } from "./sharing";

export async function getOwnedPreviewStructure(
  structureId: string,
  userId: string,
): Promise<WebsiteStructure | null> {
  const structure = await getWebsiteStructure(structureId, userId);
  if (!structure || structure.management?.deletedAt) {
    return null;
  }

  return structure;
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
  if (!structure || structure.management?.deletedAt) {
    return null;
  }

  return {
    structure,
    token,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}
