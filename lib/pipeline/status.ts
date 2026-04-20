import { createPipelineDeploymentId } from "./identity";
import type {
  PipelineDeploymentRequest,
  PipelineDeploymentStatusRecord,
  PipelineRunStatus,
} from "./types";

export function createDeploymentStatusRecord(
  request: PipelineDeploymentRequest,
  status: PipelineRunStatus,
): PipelineDeploymentStatusRecord {
  const deploymentId = createPipelineDeploymentId(
    request.idempotencyKey,
    request.build.manifest.structureId,
  );

  return {
    deploymentId,
    target: request.target,
    environment: request.environment,
    status,
    structureId: request.build.manifest.structureId,
    structureVersion: request.build.manifest.structureVersion,
    idempotencyKey: request.idempotencyKey,
    attempts: request.attempt,
    updatedAt: new Date().toISOString(),
  };
}

export function markDeploymentReady(
  record: PipelineDeploymentStatusRecord,
  params: { url: string; path: string; status?: PipelineRunStatus },
): PipelineDeploymentStatusRecord {
  const readyAt = new Date().toISOString();

  return {
    ...record,
    status: params.status ?? "ready",
    url: params.url,
    path: params.path,
    updatedAt: readyAt,
    readyAt,
    error: undefined,
  };
}

export function markDeploymentFailed(
  record: PipelineDeploymentStatusRecord,
  error: string,
): PipelineDeploymentStatusRecord {
  return {
    ...record,
    status: "failed",
    updatedAt: new Date().toISOString(),
    error,
  };
}
