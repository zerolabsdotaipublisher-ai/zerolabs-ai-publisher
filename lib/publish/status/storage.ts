import "server-only";

import { getOwnedPublishStructure } from "@/lib/publish/storage";
import { listOwnedWebsiteStructures } from "@/lib/management/storage";
import { buildPublishingStatusFromStructure } from "./model";
import type { PublishingStatusModel } from "./types";

export async function getOwnedPublishingStatus(
  structureId: string,
  userId: string,
): Promise<PublishingStatusModel | null> {
  const structure = await getOwnedPublishStructure(structureId, userId);
  if (!structure) {
    return null;
  }

  return buildPublishingStatusFromStructure(structure);
}

export async function listOwnedPublishingStatuses(userId: string): Promise<PublishingStatusModel[]> {
  const structures = await listOwnedWebsiteStructures(userId);
  return structures
    .filter((structure) => !structure.management?.deletedAt)
    .map((structure) => buildPublishingStatusFromStructure(structure));
}
