import type { PipelineDeploymentEnvironment, PipelineDeploymentTarget } from "./types";

export const PIPELINE_DEPLOYMENT_TARGETS = ["mock", "vercel"] as const;
export const PIPELINE_DEPLOYMENT_ENVIRONMENTS = ["preview", "production"] as const;

export function isPipelineDeploymentTarget(value: string): value is PipelineDeploymentTarget {
  return PIPELINE_DEPLOYMENT_TARGETS.includes(value as PipelineDeploymentTarget);
}

export function isPipelineDeploymentEnvironment(
  value: string,
): value is PipelineDeploymentEnvironment {
  return PIPELINE_DEPLOYMENT_ENVIRONMENTS.includes(value as PipelineDeploymentEnvironment);
}

export function normalizePipelineDeploymentTarget(value: string): PipelineDeploymentTarget {
  if (isPipelineDeploymentTarget(value)) {
    return value;
  }

  return "mock";
}

export function validatePipelineDeploymentTarget(value: string): string[] {
  if (isPipelineDeploymentTarget(value)) {
    return [];
  }

  return [`Unsupported deployment target "${value}". Expected mock or vercel.`];
}
