export interface PipelineScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const pipelineScenarios: PipelineScenario[] = [
  {
    id: "preview-mock-deployment",
    name: "Preview deployment",
    expectedBehavior: "A renderable website build receives a preview URL through the configured adapter.",
  },
  {
    id: "production-publish-deployment",
    name: "Production publish deployment",
    expectedBehavior: "Publish delivery runs the production pipeline and persists the live URL/status metadata.",
  },
  {
    id: "idempotent-redeploy",
    name: "Idempotent redeploy",
    expectedBehavior: "The same structure version and target produce the same idempotency key and deployment ID.",
  },
  {
    id: "validation-blocked",
    name: "Validation blocked",
    expectedBehavior: "Invalid structures fail before adapter deployment is attempted.",
  },
  {
    id: "retryable-adapter-failure",
    name: "Retryable adapter failure",
    expectedBehavior: "Retryable adapter errors are retried up to the configured attempt limit and logged.",
  },
  {
    id: "vercel-dry-run-target",
    name: "Vercel dry-run target",
    expectedBehavior: "The Vercel adapter path is selectable without performing a real Vercel deployment.",
  },
];
