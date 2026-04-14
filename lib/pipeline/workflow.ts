import "server-only";

import type { WebsiteStructure } from "@/lib/ai/structure";
import { buildWebsiteStructure } from "./build";
import { getPipelineConfig } from "./config";
import { deployBuild } from "./deployment";
import { PipelineValidationError } from "./errors";
import { emitPipelineEvent } from "./observability";
import { validatePipelineBuildInput } from "./validation";
import type {
  PipelineDeploymentEnvironment,
  PipelineDeploymentTarget,
  PipelineObserver,
  PipelineRunResult,
} from "./types";

export async function runWebsiteDeploymentPipeline(params: {
  structure: WebsiteStructure;
  environment: PipelineDeploymentEnvironment;
  target?: PipelineDeploymentTarget;
  observer?: PipelineObserver;
}): Promise<PipelineRunResult> {
  const runtimeConfig = getPipelineConfig();
  const target = params.target ?? runtimeConfig.deploymentTarget;
  const startedAt = Date.now();

  await emitPipelineEvent(
    {
      event: "pipeline_validation_started",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target,
      status: "validating",
    },
    params.observer,
  );

  const validation = validatePipelineBuildInput({
    structure: params.structure,
    environment: params.environment,
    target,
  });

  await emitPipelineEvent(
    {
      event: "pipeline_validation_completed",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target,
      status: validation.valid ? "validating" : "failed",
      durationMs: Date.now() - startedAt,
      message: validation.valid ? "Pipeline validation passed." : validation.errors.join("; "),
    },
    params.observer,
  );

  if (!validation.valid) {
    throw new PipelineValidationError(validation);
  }

  const build = await buildWebsiteStructure({
    structure: params.structure,
    environment: params.environment,
    target,
    observer: params.observer,
  });
  const deployment = await deployBuild({
    build,
    environment: params.environment,
    target,
    observer: params.observer,
  });

  return {
    build,
    deployment,
    validation,
  };
}

export function deployWebsitePreview(params: {
  structure: WebsiteStructure;
  target?: PipelineDeploymentTarget;
  observer?: PipelineObserver;
}): Promise<PipelineRunResult> {
  return runWebsiteDeploymentPipeline({
    ...params,
    environment: "preview",
  });
}

export function deployWebsiteProduction(params: {
  structure: WebsiteStructure;
  target?: PipelineDeploymentTarget;
  observer?: PipelineObserver;
}): Promise<PipelineRunResult> {
  return runWebsiteDeploymentPipeline({
    ...params,
    environment: "production",
  });
}
