import type { WebsiteStructure } from "@/lib/ai/structure";
import { deployWebsiteProduction } from "@/lib/pipeline";
import type { PublishDeliveryResult } from "./types";

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export async function deliverPublishedWebsite(structure: WebsiteStructure): Promise<PublishDeliveryResult> {
  const result = await deployWebsiteProduction({ structure });
  const deployment = result.deployment;
  const deliveredAt = deployment.readyAt ?? deployment.updatedAt;
  const domains = uniqueSorted(deployment.providerMetadata?.domains?.map((domain) => domain.domain) ?? []);

  return {
    liveUrl: deployment.url,
    livePath: deployment.path,
    deploymentId: deployment.deploymentId,
    deliveredAt,
    deployment: {
      deploymentId: deployment.deploymentId,
      target: deployment.target,
      environment: deployment.environment,
      status: deployment.status,
      providerDeploymentId: deployment.providerDeploymentId,
      url: deployment.url,
      path: deployment.path,
      domains,
      attempts: deployment.attempts,
      updatedAt: deliveredAt,
      lastError: deployment.error,
      providerMetadata: deployment.providerMetadata as unknown as Record<string, unknown>,
      logs: deployment.providerMetadata?.logs,
    },
    staticSite: {
      pageCount: result.build.ssg.metrics.pageCount,
      routeCount: result.build.ssg.metrics.routeCount,
      assetCount: result.build.ssg.metrics.assetCount,
      routePaths: uniqueSorted(result.build.ssg.data.routes.map((route) => route.path)),
      assetPaths: uniqueSorted(result.build.ssg.data.assets.map((asset) => asset.outputPath ?? asset.url)),
    },
    domain: {
      liveUrl: deployment.url,
      livePath: deployment.path,
      domains,
      providerDeploymentUrl: deployment.providerMetadata?.providerDeploymentUrl,
      preservedLivePath: true,
      preservedDomains: true,
    },
  };
}
