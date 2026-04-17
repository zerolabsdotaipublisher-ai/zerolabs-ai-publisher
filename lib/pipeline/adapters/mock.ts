import { createDeploymentStatusRecord, markDeploymentReady } from "../status";
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
    const status = markDeploymentReady(
      createDeploymentStatusRecord(request, "deploying"),
      assignedUrl,
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
      },
    };
  }
}
