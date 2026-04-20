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
    hosting: {
      vercel: {
        apiUrl: pipelineConfig.vercel.apiUrl,
        token: pipelineConfig.vercel.token,
        projectId: pipelineConfig.vercel.projectId,
        teamId: pipelineConfig.vercel.teamId,
        deployHookPreviewUrl: pipelineConfig.vercel.deployHookPreviewUrl,
        deployHookProductionUrl: pipelineConfig.vercel.deployHookProductionUrl,
        defaultDomain: pipelineConfig.vercel.defaultDomain,
        enableRealDeployments: pipelineConfig.vercel.enableRealDeployments,
        timeoutMs: pipelineConfig.vercel.timeoutMs,
      },
    },
  };
}
