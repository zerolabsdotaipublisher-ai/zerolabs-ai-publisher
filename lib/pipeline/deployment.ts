import "server-only";

import { createDeploymentAdapter } from "./adapters/registry";
import { getPipelineConfig } from "./config";
import { normalizePipelineError } from "./errors";
import { emitPipelineEvent } from "./observability";
import { withPipelineRetry } from "./retry";
import type {
  PipelineBuildOutput,
  PipelineDeploymentEnvironment,
  PipelineDeploymentResult,
  PipelineDeploymentTarget,
  PipelineObserver,
} from "./types";

export async function deployBuild(params: {
  build: PipelineBuildOutput;
  environment: PipelineDeploymentEnvironment;
  target?: PipelineDeploymentTarget;
  observer?: PipelineObserver;
}): Promise<PipelineDeploymentResult> {
  const runtimeConfig = getPipelineConfig();
  const target = params.target ?? runtimeConfig.deploymentTarget;
  const adapter = createDeploymentAdapter(target, runtimeConfig);
  const requestedAt = new Date().toISOString();
  const startedAt = Date.now();

  await emitPipelineEvent(
    {
      event: "pipeline_deployment_started",
      structureId: params.build.manifest.structureId,
      structureVersion: params.build.manifest.structureVersion,
      environment: params.environment,
      target,
      status: "deploying",
    },
    params.observer,
  );

  try {
    const result = await withPipelineRetry({
      maxAttempts: runtimeConfig.maxAttempts,
      retryBaseDelayMs: runtimeConfig.retryBaseDelayMs,
      observer: params.observer,
      createRetryEvent: (attempt, error, delayMs) => ({
        event: "pipeline_retry_scheduled",
        structureId: params.build.manifest.structureId,
        structureVersion: params.build.manifest.structureVersion,
        environment: params.environment,
        target,
        status: "deploying",
        attempt,
        message: `Retrying deployment in ${delayMs}ms.`,
        error: error.message,
      }),
      operation: (attempt) =>
        adapter.deploy({
          build: params.build,
          environment: params.environment,
          target,
          idempotencyKey: params.build.idempotencyKey,
          requestedAt,
          attempt,
        }),
    });

    await emitPipelineEvent(
      {
        event: "pipeline_deployment_completed",
        structureId: params.build.manifest.structureId,
        structureVersion: params.build.manifest.structureVersion,
        environment: params.environment,
        target,
        status: "ready",
        deploymentId: result.deploymentId,
        attempt: result.attempts,
        durationMs: Date.now() - startedAt,
      },
      params.observer,
    );

    return result;
  } catch (error) {
    const pipelineError = normalizePipelineError(error);
    await emitPipelineEvent(
      {
        event: "pipeline_deployment_failed",
        structureId: params.build.manifest.structureId,
        structureVersion: params.build.manifest.structureVersion,
        environment: params.environment,
        target,
        status: "failed",
        durationMs: Date.now() - startedAt,
        error: pipelineError.message,
      },
      params.observer,
    );
    throw pipelineError;
  }
}
