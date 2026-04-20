import "server-only";

import type { PipelineDeploymentEnvironment, PipelineHostingDomainAssignment } from "../types";

const DOMAIN_LABEL_PATTERN = /[^a-z0-9-]/g;
const DOMAIN_PATTERN = /[^a-z0-9.-]/g;
const MAX_LABEL_LENGTH = 63;
const UNIQUE_SUFFIX_LENGTH = 6;
const MAX_ENV_SUFFIX_LENGTH = "preview".length;
// Final subdomain label format: "<id-prefix>-<unique>-<environment>" (for example "my-site-ab12cd-preview").
// 63 max DNS label length minus "-<unique>-<environment>" leaves safe id prefix budget.
const MAX_SUBDOMAIN_PREFIX_LENGTH =
  MAX_LABEL_LENGTH - (1 + UNIQUE_SUFFIX_LENGTH + 1 + MAX_ENV_SUFFIX_LENGTH);

function compactHyphens(value: string): string {
  return value.replace(/-+/g, "-").replace(/^-|-$/, "");
}

function normalizeDomainLabel(value: string): string {
  return compactHyphens(value.toLowerCase().replace(DOMAIN_LABEL_PATTERN, "-")).slice(0, MAX_LABEL_LENGTH);
}

function normalizeDomain(value: string): string {
  return value.toLowerCase().replace(DOMAIN_PATTERN, "").replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "");
}

function createDeterministicSuffix(value: string): string {
  // 32-bit FNV-1a hash (offset basis 2166136261, prime 16777619) for compact deterministic suffixing.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(36).slice(0, UNIQUE_SUFFIX_LENGTH).padStart(UNIQUE_SUFFIX_LENGTH, "0");
}

export function createGeneratedSubdomain(params: {
  structureId: string;
  environment: PipelineDeploymentEnvironment;
}): string {
  const normalizedId = normalizeDomainLabel(params.structureId).slice(
    0,
    MAX_SUBDOMAIN_PREFIX_LENGTH,
  );
  const uniqueSuffix = createDeterministicSuffix(params.structureId);
  const suffix = params.environment === "preview" ? "preview" : "live";
  return compactHyphens(`${normalizedId}-${uniqueSuffix}-${suffix}`);
}

export function createGeneratedDomain(params: {
  structureId: string;
  environment: PipelineDeploymentEnvironment;
  defaultDomain?: string;
}): string | undefined {
  if (!params.defaultDomain) return undefined;
  const rootDomain = normalizeDomain(params.defaultDomain);
  if (!rootDomain) return undefined;
  return `${createGeneratedSubdomain(params)}.${rootDomain}`;
}

export function buildDomainAssignments(params: {
  environment: PipelineDeploymentEnvironment;
  generatedDomain?: string;
  providerDeploymentUrl?: string;
}): PipelineHostingDomainAssignment[] {
  const domains: PipelineHostingDomainAssignment[] = [];

  if (params.generatedDomain) {
    domains.push({
      type: "generated-subdomain",
      environment: params.environment,
      domain: params.generatedDomain,
      verified: true,
    });
  }

  if (params.providerDeploymentUrl) {
    domains.push({
      type: "provider-url",
      environment: params.environment,
      domain: params.providerDeploymentUrl,
      verified: true,
    });
  }

  return domains;
}
