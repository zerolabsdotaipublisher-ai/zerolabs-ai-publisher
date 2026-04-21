import "server-only";

import type { WebsiteStructure } from "@/lib/ai/structure";
import { getWebsiteRoutingConfig } from "@/lib/routing";
import { buildStaticSiteOutput, staticValidationMessages } from "./ssg";
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
  const pagesById = new Map(structure.pages.map((page) => [page.id, page]));
  return getWebsiteRoutingConfig(structure).routes
    .map((route) => {
      const page = pagesById.get(route.pageId);
      if (!page) {
        return undefined;
      }

      return {
        pageId: page.id,
        slug: route.slug,
        path: pageRoutePath(route.path),
        title: page.title,
        visible: route.visible,
      };
    })
    .filter((route): route is PipelinePageRoute => Boolean(route))
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
  const createdAt = new Date().toISOString();
  const ssgStartedAt = Date.now();

  await emitPipelineEvent(
    {
      event: "pipeline_ssg_started",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target: params.target,
      status: "building",
    },
    params.observer,
  );

  const ssg = buildStaticSiteOutput({
    structure: params.structure,
    environment: params.environment,
    generatedAt: createdAt,
  });
  const ssgValidationMessages = staticValidationMessages(ssg.validation);
  const buildValidation = {
    valid: validation.valid && ssg.validation.valid,
    errors: [...validation.errors, ...ssgValidationMessages.errors],
    warnings: [...validation.warnings, ...ssgValidationMessages.warnings],
  };

  if (!ssg.validation.valid) {
    await emitPipelineEvent(
      {
        event: "pipeline_ssg_failed",
        structureId: params.structure.id,
        structureVersion: params.structure.version,
        environment: params.environment,
        target: params.target,
        status: "failed",
        durationMs: Date.now() - ssgStartedAt,
        error: ssgValidationMessages.errors.join("; "),
      },
      params.observer,
    );
    throw new PipelineValidationError(buildValidation);
  }

  await emitPipelineEvent(
    {
      event: "pipeline_ssg_completed",
      structureId: params.structure.id,
      structureVersion: params.structure.version,
      environment: params.environment,
      target: params.target,
      status: "building",
      durationMs: Date.now() - ssgStartedAt,
      message: `Generated ${ssg.metrics.pageCount} static pages, ${ssg.metrics.routeCount} routes, and ${ssg.metrics.assetCount} asset references.`,
    },
    params.observer,
  );

  const manifest: PipelineBuildManifest = {
    format: "website-structure-renderable-v1",
    renderer: "components/generated-site/renderer",
    structureId: params.structure.id,
    structureVersion: params.structure.version,
    siteTitle: params.structure.siteTitle,
    environment: params.environment,
    routes: createRouteManifest(params.structure),
    ssg: {
      format: ssg.format,
      strategy: ssg.strategy,
      output: ssg.output,
      cache: ssg.cache,
      metrics: ssg.metrics,
    },
    entryPath: "/",
    sourceHash,
    createdAt,
  };

  const build: PipelineBuildOutput = {
    buildId: createPipelineBuildId(idempotencyKey),
    idempotencyKey,
    structure: params.structure,
    manifest,
    ssg,
    validation: buildValidation,
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
