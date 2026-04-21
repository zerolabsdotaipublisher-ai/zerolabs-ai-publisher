import "server-only";

import { routes } from "@/config";
import type {
  PipelineAssignedUrl,
  PipelineDeploymentEnvironment,
  PipelineRuntimeConfig,
} from "./types";

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

export function buildDeploymentPath(params: {
  structureId: string;
  environment: PipelineDeploymentEnvironment;
}): string {
  if (params.environment === "preview") {
    return routes.previewSite(params.structureId);
  }

  return routes.liveSite(params.structureId);
}

export function resolveDeploymentBaseUrl(
  environment: PipelineDeploymentEnvironment,
  runtimeConfig: PipelineRuntimeConfig,
): string {
  if (environment === "preview") {
    return runtimeConfig.previewBaseUrl ?? runtimeConfig.appBaseUrl;
  }

  return runtimeConfig.productionBaseUrl ?? runtimeConfig.appBaseUrl;
}

export function assignDeploymentUrl(params: {
  structureId: string;
  environment: PipelineDeploymentEnvironment;
  runtimeConfig: PipelineRuntimeConfig;
}): PipelineAssignedUrl {
  const path = buildDeploymentPath(params);
  const baseUrl = resolveDeploymentBaseUrl(params.environment, params.runtimeConfig);

  return {
    path,
    url: new URL(path, normalizeBaseUrl(baseUrl)).toString(),
    baseUrl,
  };
}
