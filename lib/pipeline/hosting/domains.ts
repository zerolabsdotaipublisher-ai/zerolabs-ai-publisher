import "server-only";

import type { PipelineDeploymentEnvironment, PipelineHostingDomainAssignment } from "../types";

const DOMAIN_LABEL_PATTERN = /[^a-z0-9-]/g;
const DOMAIN_PATTERN = /[^a-z0-9.-]/g;
const MAX_LABEL_LENGTH = 63;

function compactHyphens(value: string): string {
  return value.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function normalizeDomainLabel(value: string): string {
  return compactHyphens(value.toLowerCase().replace(DOMAIN_LABEL_PATTERN, "-")).slice(0, MAX_LABEL_LENGTH);
}

function normalizeDomain(value: string): string {
  return value.toLowerCase().replace(DOMAIN_PATTERN, "").replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "");
}

export function createGeneratedSubdomain(params: {
  structureId: string;
  environment: PipelineDeploymentEnvironment;
}): string {
  const normalizedId = normalizeDomainLabel(params.structureId).slice(0, 52);
  const suffix = params.environment === "preview" ? "preview" : "live";
  return compactHyphens(`${normalizedId}-${suffix}`);
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
