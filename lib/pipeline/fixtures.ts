import { landingPageStructureFixture } from "@/lib/ai/structure/fixtures";
import type { PipelineBuildInput, PipelineDeploymentRequest } from "./types";
import { createPipelineIdempotencyKey } from "./identity";

export const previewPipelineBuildInputFixture: PipelineBuildInput = {
  structure: landingPageStructureFixture,
  environment: "preview",
  target: "mock",
};

export const productionPipelineBuildInputFixture: PipelineBuildInput = {
  structure: landingPageStructureFixture,
  environment: "production",
  target: "vercel",
};

export const pipelineIdempotencyKeyFixture = createPipelineIdempotencyKey(
  previewPipelineBuildInputFixture,
);

export const pipelineDeploymentRequestFixture = {
  environment: "preview",
  target: "mock",
  idempotencyKey: pipelineIdempotencyKeyFixture,
  requestedAt: "2026-04-14T00:00:00.000Z",
  attempt: 1,
} satisfies Omit<PipelineDeploymentRequest, "build">;
