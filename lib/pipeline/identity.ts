import type { WebsiteStructure } from "@/lib/ai/structure";
import type { PipelineDeploymentEnvironment, PipelineDeploymentTarget } from "./types";

function hashString(input: string): string {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function createStructureSourceHash(structure: WebsiteStructure): string {
  return hashString(
    JSON.stringify({
      id: structure.id,
      version: structure.version,
      siteTitle: structure.siteTitle,
      pages: structure.pages,
      navigation: structure.navigation,
      seo: structure.seo,
      styleConfig: structure.styleConfig,
      layout: structure.layout,
    }),
  );
}

export function createPipelineIdempotencyKey(params: {
  structure: WebsiteStructure;
  environment: PipelineDeploymentEnvironment;
  target: PipelineDeploymentTarget;
}): string {
  const sourceHash = createStructureSourceHash(params.structure);
  return [
    params.target,
    params.environment,
    params.structure.id,
    `v${params.structure.version}`,
    sourceHash,
  ].join(":");
}

export function createPipelineBuildId(idempotencyKey: string): string {
  return `build_${hashString(idempotencyKey)}`;
}

export function createPipelineDeploymentId(idempotencyKey: string, structureId: string): string {
  return `deploy_${sanitizeId(structureId)}_${hashString(idempotencyKey)}`;
}
