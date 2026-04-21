export interface PipelineHostingScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const pipelineHostingScenarios: PipelineHostingScenario[] = [
  {
    id: "hosting-preview-deployment",
    name: "Preview hosting deployment",
    expectedBehavior: "Preview deployments return a preview URL and isolated hosting metadata.",
  },
  {
    id: "hosting-production-deployment",
    name: "Production hosting deployment",
    expectedBehavior: "Production publish deploys through the same pipeline and returns stable public URL metadata.",
  },
  {
    id: "hosting-failed-deployment",
    name: "Hosting deployment failure",
    expectedBehavior: "Provider failures return typed hosting errors and failed status without mutating unrelated metadata.",
  },
  {
    id: "hosting-domain-assignment",
    name: "Generated domain assignment",
    expectedBehavior: "Each website gets a deterministic generated subdomain strategy per environment.",
  },
  {
    id: "hosting-update-redeploy",
    name: "Update and redeploy",
    expectedBehavior: "Subsequent publish updates set updating/deploying status and redeploy through the same adapter path.",
  },
  {
    id: "hosting-domain-stability",
    name: "Stable domain handling during updates",
    expectedBehavior: "Production deployment updates preserve generated/live domain mappings instead of breaking the current live route contract.",
  },
  {
    id: "hosting-cache-refresh-metadata",
    name: "Cache refresh metadata",
    expectedBehavior: "Deployment responses can be mapped to provider-neutral cache invalidation metadata for the affected SSG routes and assets.",
  },
  {
    id: "hosting-invalid-config",
    name: "Invalid hosting config",
    expectedBehavior: "Invalid Vercel real-deploy configuration fails fast with actionable typed errors.",
  },
];
