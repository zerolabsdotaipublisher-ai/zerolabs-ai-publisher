import "server-only";

import type { WebsiteStructure } from "@/lib/ai/structure";
import { PipelineValidationError } from "./errors";
import {
  createPipelineBuildId,
  createPipelineIdempotencyKey,
  createStructureSourceHash,
} from "./identity";
import { emitPipelineEvent } from "./observability";
import { validatePipelineBuildInput } from "./validation";
import type {
  PipelineBuildManifest,
  PipelineBuildOutput,
  PipelineDeploymentEnvironment,
  PipelineDeploymentTarget,
  PipelineObserver,
  PipelinePageRoute,
} from "./types";

function pageRoutePath(slug: string): string {
  return slug === "/" ? "/" : slug;
}

function createRouteManifest(structure: WebsiteStructure): PipelinePageRoute[] {
  return structure.pages
    .filter((page) => page.visible !== false)
    .map((page) => ({
      pageId: page.id,
      slug: page.slug,
      path: pageRoutePath(page.slug),
      title: page.title,
      visible: page.visible !== false,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function buildWebsiteStructure(params: {
  structure: WebsiteStructure;
  environment: PipelineDeploymentEnvironment;
  target: PipelineDeploymentTarget;
  observer?: PipelineObserver;
}): Promise<PipelineBuildOutput> {
  const startedAt = Date.now();

  await emitPipelineEvent(
    {
      event: "pipeline_build_started",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target: params.target,
      status: "building",
    },
    params.observer,
  );

  const validation = validatePipelineBuildInput({
    structure: params.structure,
    environment: params.environment,
    target: params.target,
  });

  if (!validation.valid) {
    throw new PipelineValidationError(validation);
  }

  const idempotencyKey = createPipelineIdempotencyKey(params);
  const sourceHash = createStructureSourceHash(params.structure);
  const manifest: PipelineBuildManifest = {
    format: "website-structure-renderable-v1",
    renderer: "components/generated-site/renderer",
    structureId: params.structure.id,
    structureVersion: params.structure.version,
    siteTitle: params.structure.siteTitle,
    environment: params.environment,
    routes: createRouteManifest(params.structure),
    entryPath: "/",
    sourceHash,
    createdAt: new Date().toISOString(),
  };

  const build: PipelineBuildOutput = {
    buildId: createPipelineBuildId(idempotencyKey),
    idempotencyKey,
    structure: params.structure,
    manifest,
    validation,
  };

  await emitPipelineEvent(
    {
      event: "pipeline_build_completed",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target: params.target,
      status: "building",
      durationMs: Date.now() - startedAt,
    },
    params.observer,
  );

  return build;
}
