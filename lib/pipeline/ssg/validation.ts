import type { WebsiteStructure } from "@/lib/ai/structure";
import { STATIC_PAGE_DATA_REQUIREMENTS, resolveStaticSiteData } from "./data";
import { createStaticRouteValidationIssues } from "./routes";
import type {
  StaticCacheStrategy,
  StaticOutputManifest,
  StaticPageData,
  StaticSiteResolutionInput,
  StaticSiteData,
  StaticValidationIssue,
  StaticValidationResult,
} from "./types";

const pageDataBudgetBytes = 128 * 1024;
const staticOutputPathPattern = /^(?:assets|cache|data|manifest|pages|routes)\/[a-zA-Z0-9/_.,-]+$/;

function toValidationResult(issues: StaticValidationIssue[]): StaticValidationResult {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function estimateBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function validateOutputPath(path: string, kind: string): StaticValidationIssue[] {
  if (staticOutputPathPattern.test(path)) {
    return [];
  }

  return [
    {
      code: "invalid_output_path",
      severity: "error",
      fieldPath: kind,
      message: `Static output path "${path}" for ${kind} is not compatible with the expected static file layout.`,
    },
  ];
}

function validateAssetReferences(page: StaticPageData): StaticValidationIssue[] {
  return page.assets.flatMap((asset) => {
    const issues: StaticValidationIssue[] = [];
    const isLocalAsset = asset.url.startsWith("/");
    const isExternalAsset = /^https?:\/\//i.test(asset.url);
    const isDataImage = asset.url.startsWith("data:image/");

    if (!asset.url.trim()) {
      issues.push({
        code: "missing_asset",
        severity: "error",
        pageId: page.page.id,
        sectionId: asset.sectionId,
        fieldPath: asset.fieldPath,
        message: "Static asset reference is missing a URL.",
      });
    }

    if (!isLocalAsset && !isExternalAsset && !isDataImage) {
      issues.push({
        code: "missing_asset",
        severity: "error",
        pageId: page.page.id,
        sectionId: asset.sectionId,
        fieldPath: asset.fieldPath,
        message: `Static asset "${asset.url}" must be an absolute URL, a root-relative public asset path, or a data image.`,
      });
    }

    if (isLocalAsset && (asset.url.includes("..") || /\s/.test(asset.url))) {
      issues.push({
        code: "missing_asset",
        severity: "error",
        pageId: page.page.id,
        sectionId: asset.sectionId,
        fieldPath: asset.fieldPath,
        message: `Static asset "${asset.url}" is not a safe public asset path.`,
      });
    }

    return issues;
  });
}

export function validateStaticPageData(page: StaticPageData): StaticValidationIssue[] {
  const issues: StaticValidationIssue[] = [];

  for (const missing of page.completeness.missing) {
    const requirement = STATIC_PAGE_DATA_REQUIREMENTS.find((candidate) => candidate.key === missing);
    issues.push({
      code:
        missing === "structure"
          ? "missing_structure"
          : missing === "page"
            ? "missing_page"
            : missing === "sections"
              ? "missing_section"
              : missing === "navigation"
                ? "missing_navigation"
                : missing === "metadata"
                  ? "missing_metadata"
                  : missing === "layoutStyle"
                    ? "missing_layout_style"
                    : "missing_asset",
      severity: "error",
      pageId: page.page.id,
      routePath: page.route.path,
      message: requirement
        ? `Static page "${page.page.title}" is missing ${requirement.label}: ${requirement.requiredFields.join(", ")}.`
        : `Static page "${page.page.title}" is missing required data.`,
    });
  }

  if (!page.metadata.title.trim() || !page.metadata.description.trim()) {
    issues.push({
      code: "missing_metadata",
      severity: "error",
      pageId: page.page.id,
      routePath: page.route.path,
      message: `Static page "${page.page.title}" must include build-time title and description metadata.`,
    });
  }

  if (page.sections.length === 0) {
    issues.push({
      code: "missing_section",
      severity: "error",
      pageId: page.page.id,
      routePath: page.route.path,
      message: `Static page "${page.page.title}" must include at least one visible section.`,
    });
  }

  const estimatedPageBytes = estimateBytes(page);
  if (estimatedPageBytes > pageDataBudgetBytes) {
    issues.push({
      code: "payload_too_large",
      severity: "warning",
      pageId: page.page.id,
      routePath: page.route.path,
      message: `Static page "${page.page.title}" data is ${estimatedPageBytes} bytes, above the MVP target of ${pageDataBudgetBytes} bytes.`,
    });
  }

  return [...issues, ...validateAssetReferences(page)];
}

export function validateStaticSiteData(params: {
  data: StaticSiteData;
  structure?: WebsiteStructure;
}): StaticValidationResult {
  const issues: StaticValidationIssue[] = [];

  if (params.data.pages.length === 0) {
    issues.push({
      code: "missing_page",
      severity: "error",
      message: "Static site output requires at least one visible page.",
    });
  }

  issues.push(...params.data.pages.flatMap((page) => validateStaticPageData(page)));

  if (params.structure) {
    issues.push(...createStaticRouteValidationIssues(params.structure, params.data.routes));
  }

  return toValidationResult(issues);
}

export function validateStaticOutputManifest(
  output: StaticOutputManifest,
): StaticValidationIssue[] {
  const manifestIssues: StaticValidationIssue[] = [
    ...validateOutputPath(output.manifestPath, "manifestPath"),
    ...validateOutputPath(output.routeManifestPath, "routeManifestPath"),
    ...validateOutputPath(output.assetManifestPath, "assetManifestPath"),
    ...validateOutputPath(output.cachePolicyPath, "cachePolicyPath"),
  ];

  const expectedFileIssues = output.expectedFiles.flatMap((file) =>
    validateOutputPath(file.path, `expectedFiles.${file.kind}`),
  );

  return [...manifestIssues, ...expectedFileIssues];
}

export function validateStaticCacheStrategy(
  cache: StaticCacheStrategy,
): StaticValidationIssue[] {
  const policyIds = new Set(cache.policies.map((policy) => policy.id));
  const requiredPolicyIds = [
    cache.defaultPagePolicyId,
    cache.defaultDataPolicyId,
    cache.defaultAssetPolicyId,
  ];

  return requiredPolicyIds
    .filter((id) => !policyIds.has(id))
    .map((id) => ({
      code: "invalid_cache_policy",
      severity: "error",
      fieldPath: id,
      message: `Static cache policy "${id}" is referenced but not defined.`,
    }));
}

export function validateStaticSiteReadiness(
  input: StaticSiteResolutionInput,
): StaticValidationResult {
  const data = resolveStaticSiteData(input);
  return validateStaticSiteData({ data, structure: input.structure });
}

export function staticValidationMessages(result: StaticValidationResult): {
  errors: string[];
  warnings: string[];
} {
  return {
    errors: result.errors.map((issue) => issue.message),
    warnings: result.warnings.map((issue) => issue.message),
  };
}

export { toValidationResult as createStaticValidationResult };
