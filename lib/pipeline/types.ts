import type { RuntimeEnvironment } from "@/config";
import type { WebsiteStructure } from "@/lib/ai/structure";
import type { StaticSiteArtifact } from "./ssg/types";

export type PipelineDeploymentEnvironment = "preview" | "production";
export type PipelineDeploymentTarget = "mock" | "vercel";

export type PipelineRunStatus =
  | "queued"
  | "validating"
  | "building"
  | "deploying"
  | "updating"
  | "deployed"
  | "ready"
  | "failed";

export type PipelineEventName =
  | "pipeline_validation_started"
  | "pipeline_validation_completed"
  | "pipeline_build_started"
  | "pipeline_build_completed"
  | "pipeline_ssg_started"
  | "pipeline_ssg_completed"
  | "pipeline_ssg_failed"
  | "pipeline_deployment_started"
  | "pipeline_deployment_completed"
  | "pipeline_deployment_failed"
  | "pipeline_retry_scheduled";

export interface PipelineRuntimeConfig {
  deploymentTarget: PipelineDeploymentTarget;
  previewBaseUrl?: string;
  productionBaseUrl?: string;
  maxAttempts: number;
  retryBaseDelayMs: number;
  runtimeStage: RuntimeEnvironment;
  appBaseUrl: string;
  hosting: {
    vercel: {
      apiUrl: string;
      token?: string;
      projectId?: string;
      teamId?: string;
      deployHookPreviewUrl?: string;
      deployHookProductionUrl?: string;
      defaultDomain?: string;
      enableRealDeployments: boolean;
      timeoutMs: number;
    };
  };
}

export interface PipelineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PipelinePageRoute {
  pageId: string;
  slug: string;
  path: string;
  title: string;
  visible: boolean;
}

export interface PipelineBuildManifest {
  format: "website-structure-renderable-v1";
  renderer: "components/generated-site/renderer";
  structureId: string;
  structureVersion: number;
  siteTitle: string;
  environment: PipelineDeploymentEnvironment;
  routes: PipelinePageRoute[];
  ssg: {
    format: StaticSiteArtifact["format"];
    strategy: StaticSiteArtifact["strategy"];
    output: StaticSiteArtifact["output"];
    cache: StaticSiteArtifact["cache"];
    metrics: StaticSiteArtifact["metrics"];
  };
  entryPath: string;
  sourceHash: string;
  createdAt: string;
}

export interface PipelineBuildOutput {
  buildId: string;
  idempotencyKey: string;
  structure: WebsiteStructure;
  manifest: PipelineBuildManifest;
  ssg: StaticSiteArtifact;
  validation: PipelineValidationResult;
}

export interface PipelineBuildInput {
  structure: WebsiteStructure;
  environment: PipelineDeploymentEnvironment;
  target: PipelineDeploymentTarget;
}

export interface PipelineDeploymentRequest {
  build: PipelineBuildOutput;
  environment: PipelineDeploymentEnvironment;
  target: PipelineDeploymentTarget;
  idempotencyKey: string;
  requestedAt: string;
  attempt: number;
}

export interface PipelineAssignedUrl {
  path: string;
  url: string;
  baseUrl: string;
}

export interface PipelineDeploymentStatusRecord {
  deploymentId: string;
  target: PipelineDeploymentTarget;
  environment: PipelineDeploymentEnvironment;
  status: PipelineRunStatus;
  structureId: string;
  structureVersion: number;
  idempotencyKey: string;
  url?: string;
  path?: string;
  attempts: number;
  updatedAt: string;
  readyAt?: string;
  error?: string;
}

export type PipelineHostingLogLevel = "info" | "warn" | "error";

export interface PipelineHostingLogEntry {
  at: string;
  level: PipelineHostingLogLevel;
  message: string;
  details?: Record<string, unknown>;
}

export interface PipelineHostingError {
  code: string;
  message: string;
  retryable: boolean;
  provider: PipelineDeploymentTarget;
  details?: Record<string, unknown>;
}

export interface PipelineHostingDomainAssignment {
  type: "generated-subdomain" | "provider-url";
  environment: PipelineDeploymentEnvironment;
  domain: string;
  verified: boolean;
}

export interface PipelineHostingSecurityMetadata {
  httpsOnly: boolean;
  tlsManagedByProvider: boolean;
  publicAccess: "public";
}

export interface PipelineHostingMetadata {
  adapter: PipelineDeploymentTarget;
  dryRun: boolean;
  buildId: string;
  manifestFormat: PipelineBuildOutput["manifest"]["format"];
  ssgFormat: PipelineBuildOutput["ssg"]["format"];
  staticPageCount: number;
  staticRouteCount: number;
  projectId?: string;
  teamId?: string;
  providerDeploymentUrl?: string;
  domains?: PipelineHostingDomainAssignment[];
  security: PipelineHostingSecurityMetadata;
  logs?: PipelineHostingLogEntry[];
}

export interface PipelineDeploymentResult extends PipelineDeploymentStatusRecord {
  url: string;
  path: string;
  providerDeploymentId: string;
  providerMetadata: PipelineHostingMetadata;
  hostingError?: PipelineHostingError;
}

export interface PipelineRunResult {
  build: PipelineBuildOutput;
  deployment: PipelineDeploymentResult;
  validation: PipelineValidationResult;
}

export interface PipelineEvent {
  event: PipelineEventName;
  structureId: string;
  structureVersion: number;
  environment: PipelineDeploymentEnvironment;
  target: PipelineDeploymentTarget;
  status?: PipelineRunStatus;
  deploymentId?: string;
  attempt?: number;
  durationMs?: number;
  message?: string;
  error?: string;
}

export interface PipelineObserver {
  onEvent(event: PipelineEvent): void | Promise<void>;
}
