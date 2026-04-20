import { createDeploymentStatusRecord, markDeploymentReady } from "../status";
import { buildDomainAssignments, createGeneratedDomain } from "../hosting/domains";
import { createHostingLog } from "../hosting/logs";
import { createHostingSecurityMetadata } from "../hosting/security";
import { getDeploymentInProgressStatus } from "../hosting/status";
import { assignDeploymentUrl } from "../urls";
import type {
  PipelineDeploymentRequest,
  PipelineDeploymentResult,
  PipelineRuntimeConfig,
} from "../types";
import type { DeploymentAdapter } from "./types";

export class MockDeploymentAdapter implements DeploymentAdapter {
  constructor(private readonly runtimeConfig: PipelineRuntimeConfig) {}

  async deploy(request: PipelineDeploymentRequest): Promise<PipelineDeploymentResult> {
    const assignedUrl = assignDeploymentUrl({
      structureId: request.build.manifest.structureId,
      environment: request.environment,
      runtimeConfig: this.runtimeConfig,
    });
    const generatedDomain = createGeneratedDomain({
      structureId: request.build.manifest.structureId,
      environment: request.environment,
      defaultDomain: this.runtimeConfig.hosting.vercel.defaultDomain,
    });
    const status = markDeploymentReady(
      createDeploymentStatusRecord(request, getDeploymentInProgressStatus(request.attempt)),
      {
        ...assignedUrl,
        status: "deployed",
      },
    );

    return {
      ...status,
      url: assignedUrl.url,
      path: assignedUrl.path,
      providerDeploymentId: status.deploymentId,
      providerMetadata: {
        adapter: "mock",
        dryRun: true,
        buildId: request.build.buildId,
        manifestFormat: request.build.manifest.format,
        ssgFormat: request.build.ssg.format,
        staticPageCount: request.build.ssg.metrics.pageCount,
        staticRouteCount: request.build.ssg.metrics.routeCount,
        domains: buildDomainAssignments({
          environment: request.environment,
          generatedDomain,
        }),
        security: createHostingSecurityMetadata(),
        logs: [createHostingLog("Mock adapter completed deployment assignment.")],
      },
    };
  }
}
