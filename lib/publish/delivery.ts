import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PublishDeliveryResult } from "./types";
import { buildLivePath, buildLiveUrl } from "./urls";

export async function deliverPublishedWebsite(structure: WebsiteStructure): Promise<PublishDeliveryResult> {
  const deliveredAt = new Date().toISOString();

  return {
    liveUrl: buildLiveUrl(structure.id),
    livePath: buildLivePath(structure.id),
    deploymentId: `deploy_${structure.id}_${Date.now().toString(36)}`,
    deliveredAt,
  };
}
