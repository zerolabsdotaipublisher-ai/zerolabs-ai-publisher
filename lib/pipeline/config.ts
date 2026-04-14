import "server-only";

import { config } from "@/config";
import { normalizePipelineDeploymentTarget } from "./schema";
import type { PipelineRuntimeConfig } from "./types";

export function getPipelineConfig(): PipelineRuntimeConfig {
  const pipelineConfig = config.services.pipeline;

  return {
    deploymentTarget: normalizePipelineDeploymentTarget(pipelineConfig.deploymentTarget),
    previewBaseUrl: pipelineConfig.previewBaseUrl,
    productionBaseUrl: pipelineConfig.productionBaseUrl,
    maxAttempts: pipelineConfig.maxAttempts,
    retryBaseDelayMs: pipelineConfig.retryBaseDelayMs,
    runtimeStage: config.app.environment,
    appBaseUrl: config.app.url,
  };
}
