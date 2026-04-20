import { pipelineHostingScenarios } from "./hosting/scenarios";

export interface PipelineScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const pipelineScenarios: PipelineScenario[] = [
  {
    id: "preview-mock-deployment",
    name: "Preview deployment",
    expectedBehavior: "A renderable website build includes SSG-ready artifacts and receives a preview URL through the configured adapter.",
  },
  {
    id: "production-publish-deployment",
    name: "Production publish deployment",
    expectedBehavior: "Publish delivery runs the production pipeline, validates static route/page artifacts, and persists the live URL/status metadata.",
  },
  {
    id: "idempotent-redeploy",
    name: "Idempotent redeploy",
    expectedBehavior: "The same structure version and target produce the same idempotency key and deployment ID.",
  },
  {
    id: "validation-blocked",
    name: "Validation blocked",
    expectedBehavior: "Invalid structures or invalid SSG output fail before adapter deployment is attempted.",
  },
  {
    id: "static-route-coverage",
    name: "Static route coverage",
    expectedBehavior: "Every visible WebsiteStructure page is represented in the SSG route manifest.",
  },
  {
    id: "static-metadata-included",
    name: "Static metadata included",
    expectedBehavior: "Static page artifacts include page title, description, keywords, canonical, and Open Graph metadata when available.",
  },
  {
    id: "static-asset-validation",
    name: "Static asset validation",
    expectedBehavior: "Local and external asset references are represented in the static asset manifest and validated before deployment.",
  },
  {
    id: "retryable-adapter-failure",
    name: "Retryable adapter failure",
    expectedBehavior: "Retryable adapter errors are retried up to the configured attempt limit and logged.",
  },
  {
    id: "vercel-safe-real-integration",
    name: "Vercel real integration with safe fallback",
    expectedBehavior: "The Vercel adapter performs real deploy-hook calls when enabled and falls back to dry-run safely when not configured.",
  },
  ...pipelineHostingScenarios,
];
