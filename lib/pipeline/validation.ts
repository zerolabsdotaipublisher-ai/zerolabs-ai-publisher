import {
  hasMinimumRenderableStructure,
  type WebsitePage,
  type WebsiteStructure,
} from "@/lib/ai/structure";
import { validatePipelineDeploymentTarget } from "./schema";
import type {
  PipelineBuildInput,
  PipelineDeploymentEnvironment,
  PipelineValidationResult,
} from "./types";

const slugPattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function routePathForPage(page: WebsitePage): string {
  return page.slug === "/" ? "/" : page.slug;
}

export function validatePipelineStructure(
  structure: WebsiteStructure,
  environment: PipelineDeploymentEnvironment,
): PipelineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasMinimumRenderableStructure(structure)) {
    errors.push("Website structure is missing the minimum renderable hero content.");
  }

  if (structure.management?.deletedAt) {
    errors.push("Deleted websites cannot be deployed.");
  }

  if (structure.status === "archived") {
    errors.push("Archived websites cannot be deployed.");
  }

  const visiblePages = structure.pages.filter((page) => page.visible !== false);
  if (visiblePages.length === 0) {
    errors.push("At least one visible page is required for deployment.");
  }

  const slugs = new Set<string>();
  for (const page of structure.pages) {
    if (!slugPattern.test(page.slug)) {
      errors.push(`Page "${page.title}" has an invalid deployment slug.`);
    }

    const path = routePathForPage(page);
    if (slugs.has(path)) {
      errors.push(`Page deployment path "${path}" is duplicated.`);
    }
    slugs.add(path);

    if (page.visible === false) {
      warnings.push(`Page "${page.title}" is hidden and will not be routed.`);
      continue;
    }

    if (!page.sections.some((section) => section.visible !== false)) {
      errors.push(`Page "${page.title}" must include at least one visible section.`);
    }
  }

  if (environment === "production" && structure.pages.some((page) => !page.seo?.title?.trim())) {
    errors.push("Production deployments require page SEO titles.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validatePipelineBuildInput(input: PipelineBuildInput): PipelineValidationResult {
  const structureValidation = validatePipelineStructure(input.structure, input.environment);
  const targetErrors = validatePipelineDeploymentTarget(input.target);

  return {
    valid: structureValidation.valid && targetErrors.length === 0,
    errors: [...structureValidation.errors, ...targetErrors],
    warnings: structureValidation.warnings,
  };
}

export function assertPipelineValidation(result: PipelineValidationResult): void {
  if (!result.valid) {
    throw new Error(`Pipeline validation failed: ${result.errors.join("; ")}`);
  }
}
