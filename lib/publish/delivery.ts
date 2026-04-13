import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PublishDeliveryResult } from "./types";
import { buildLivePath, buildLiveUrl } from "./urls";

export async function deliverPublishedWebsite(structure: WebsiteStructure): Promise<PublishDeliveryResult> {
  const deliveredAt = new Date().toISOString();
  const deploymentId = `deploy_${structure.id}_${crypto.randomUUID()}`;

  return {
    liveUrl: buildLiveUrl(structure.id),
    livePath: buildLivePath(structure.id),
    deploymentId,
    deliveredAt,
  };
}
