import type { PipelineDeploymentRequest, PipelineDeploymentResult } from "../types";

export interface DeploymentAdapter {
  deploy(request: PipelineDeploymentRequest): Promise<PipelineDeploymentResult>;
}
