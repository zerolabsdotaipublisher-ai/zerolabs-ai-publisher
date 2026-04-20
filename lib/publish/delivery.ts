import type { WebsiteStructure } from "@/lib/ai/structure";
import { deployWebsiteProduction } from "@/lib/pipeline";
import type { PublishDeliveryResult } from "./types";

export async function deliverPublishedWebsite(structure: WebsiteStructure): Promise<PublishDeliveryResult> {
  const result = await deployWebsiteProduction({ structure });
  const deployment = result.deployment;

  return {
    liveUrl: deployment.url,
    livePath: deployment.path,
    deploymentId: deployment.deploymentId,
    deliveredAt: deployment.readyAt ?? deployment.updatedAt,
    deployment: {
      deploymentId: deployment.deploymentId,
      target: deployment.target,
      environment: deployment.environment,
      status: deployment.status,
      providerDeploymentId: deployment.providerDeploymentId,
      url: deployment.url,
      path: deployment.path,
      domains: deployment.providerMetadata.domains?.map((domain) => domain.domain),
      attempts: deployment.attempts,
      updatedAt: deployment.readyAt ?? deployment.updatedAt,
      lastError: deployment.error,
      providerMetadata: deployment.providerMetadata,
      logs: deployment.providerMetadata.logs,
    },
  };
}
