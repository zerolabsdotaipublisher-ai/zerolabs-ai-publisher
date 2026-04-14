import type { RuntimeEnvironment } from "@/config";
import type { WebsiteStructure } from "@/lib/ai/structure";

export type PipelineDeploymentEnvironment = "preview" | "production";
export type PipelineDeploymentTarget = "mock" | "vercel";

export type PipelineRunStatus =
  | "queued"
  | "validating"
  | "building"
  | "deploying"
  | "ready"
  | "failed";

export type PipelineEventName =
  | "pipeline_validation_started"
  | "pipeline_validation_completed"
  | "pipeline_build_started"
  | "pipeline_build_completed"
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
  entryPath: string;
  sourceHash: string;
  createdAt: string;
}

export interface PipelineBuildOutput {
  buildId: string;
  idempotencyKey: string;
  structure: WebsiteStructure;
  manifest: PipelineBuildManifest;
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

export interface PipelineDeploymentResult extends PipelineDeploymentStatusRecord {
  url: string;
  path: string;
  providerDeploymentId: string;
  providerMetadata: Record<string, unknown>;
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
