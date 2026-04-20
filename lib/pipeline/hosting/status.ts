import "server-only";

import type { PipelineRunStatus } from "../types";

export function getDeploymentInProgressStatus(attempt: number): PipelineRunStatus {
  return attempt > 1 ? "updating" : "deploying";
}

export function mapVercelStateToPipelineStatus(state: string | undefined): PipelineRunStatus {
  const normalized = state?.toUpperCase();

  if (normalized === "READY") return "deployed";
  if (normalized === "ERROR" || normalized === "CANCELED") return "failed";

  return "deploying";
}
