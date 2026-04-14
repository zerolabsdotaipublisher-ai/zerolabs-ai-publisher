import type { PipelineDeploymentTarget, PipelineRuntimeConfig } from "../types";
import type { DeploymentAdapter } from "./types";
import { MockDeploymentAdapter } from "./mock";
import { VercelDeploymentAdapter } from "./vercel";

export function createDeploymentAdapter(
  target: PipelineDeploymentTarget,
  runtimeConfig: PipelineRuntimeConfig,
): DeploymentAdapter {
  if (target === "vercel") {
    return new VercelDeploymentAdapter(runtimeConfig);
  }

  return new MockDeploymentAdapter(runtimeConfig);
}
