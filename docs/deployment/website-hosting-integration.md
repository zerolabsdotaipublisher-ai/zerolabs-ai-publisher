# Website Hosting Integration (ZLAP-STORY 5-3)

## Purpose

Story 5-3 adds real website hosting integration to the existing Layer 1 pipeline in AI Publisher.

AI Publisher (Layer 1) owns:

- hosting provider integration
- deployment orchestration for generated websites
- preview and production URL behavior
- generated subdomain/domain strategy
- product-specific hosting metadata stored in publication state

ZeroFlow (Layer 2) remains responsible for shared services (auth, billing, usage, storage abstractions, observability) and does **not** own website rendering/hosting project mapping/deployment adapter logic.

## MVP Provider Choice

- Primary provider: **Vercel**
- Existing `mock` deployment adapter remains available for local/dev/test safety
- Vercel adapter supports:
  - safe dry-run mode (default)
  - real programmatic deployment trigger mode via deploy hooks when explicitly enabled
  - preview vs production separation
  - typed hosting metadata, logs, and error handling

## Architecture and Flow

Story 5-3 extends the existing pipeline; it does not introduce a second deployment system.
Story 5-5 continues that same path for deployment updates; update orchestration, version history, retry, cache, and domain stability stay app-owned in AI Publisher. See [website-deployment-updates.md](./website-deployment-updates.md).

1. `buildWebsiteStructure()` produces `PipelineBuildOutput` with the existing SSG artifact (`build.ssg`).
2. `deployBuild()` selects adapter (`mock` or `vercel`) through existing config.
3. Adapter performs deployment behavior for preview/production.
4. Adapter returns typed deployment status + hosting metadata.
5. Publish workflow persists deployment metadata in `WebsiteStructure.publication.deployment`.

No new build model is introduced; hosting continues to consume `PipelineBuildOutput + StaticSiteArtifact`.

## Hosting Identity and Domain Strategy

For each deployment, AI Publisher derives deterministic hosting identity from the website structure id and environment:

- preview subdomain suffix: `-preview`
- production subdomain suffix: `-live`
- optional generated default domain: `<derived-subdomain>.<PIPELINE_VERCEL_DEFAULT_DOMAIN>`

If a default domain is configured, publish metadata can expose stable generated domain URLs.
If not configured, provider URL or existing assigned URL behavior is preserved.

Custom domains are intentionally deferred in MVP (prepared by typed metadata only).

## Environments

### Preview

- Triggered by preview pipeline path (`deployWebsitePreview`)
- Isolated from production
- Uses preview deploy hook URL when real deployments are enabled:
  - `PIPELINE_VERCEL_DEPLOY_HOOK_PREVIEW_URL`

### Production

- Triggered by publish/update workflow via `deployWebsiteProduction`
- Uses production deploy hook URL when real deployments are enabled:
  - `PIPELINE_VERCEL_DEPLOY_HOOK_PRODUCTION_URL`
- Persists live deployment metadata in publication state

## Configuration

All environment reads are centralized in `config/env.ts` and surfaced via `config/services.ts`.

Pipeline + Vercel settings:

- `PIPELINE_DEPLOYMENT_TARGET`
- `PIPELINE_PREVIEW_BASE_URL`
- `PIPELINE_PRODUCTION_BASE_URL`
- `PIPELINE_MAX_ATTEMPTS`
- `PIPELINE_RETRY_BASE_DELAY_MS`
- `PIPELINE_VERCEL_API_URL`
- `PIPELINE_VERCEL_TOKEN`
- `PIPELINE_VERCEL_PROJECT_ID`
- `PIPELINE_VERCEL_TEAM_ID`
- `PIPELINE_VERCEL_DEPLOY_HOOK_PREVIEW_URL`
- `PIPELINE_VERCEL_DEPLOY_HOOK_PRODUCTION_URL`
- `PIPELINE_VERCEL_DEFAULT_DOMAIN`
- `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS`
- `PIPELINE_VERCEL_TIMEOUT_MS`

## Hosting Status, Logs, and Errors

Lifecycle statuses supported in pipeline/publication metadata:

- `queued`
- `deploying`
- `updating`
- `deployed` (and compatibility `ready`)
- `failed`

Typed hosting records include:

- deployment logs (info/warn/error)
- provider deployment id/url metadata
- generated/provider domains
- security metadata
- typed failure metadata routed through existing pipeline error handling

## SSL, Security, and Access Control

MVP security behavior:

- HTTPS-only expectation for hosted output
- TLS managed by Vercel provider
- hosted sites are public by URL
- management/deployment actions stay protected by existing publish/auth ownership checks

This story does not weaken auth boundaries or move authorization to hosting provider logic.

## Performance and Scalability

- hosting deploys existing SSG artifact output from pipeline
- static routes/pages remain CDN-friendly
- cache rules remain provider-neutral in SSG artifact
- no separate rendering format or duplicate deployment model

## Troubleshooting

1. Real deploys enabled but missing deploy hook URL:
   - adapter fails fast with actionable configuration error
2. Provider call timeout:
   - adapter returns retryable deployment failure
3. Provider non-2xx response:
   - pipeline retry policy applies based on error retryability
4. Unexpected domain behavior:
   - verify `PIPELINE_VERCEL_DEFAULT_DOMAIN` and environment-specific deploy hook settings

## MVP Boundaries

- Vercel is the primary hosting path for MVP.
- Custom domains are not fully implemented.
- Mock adapter remains for local/dev/test.
- No provider-specific ISR/CDN overbuild.
- No new auth/billing/platform logic added.
- No hosting logic moved to `services/zeroflow`.

## Task-to-File Mapping (Story Tasks 1-16)

1. Define requirements: `docs/deployment/website-hosting-integration.md`
2. Select/configure provider: `config/env.ts`, `config/services.ts`, `.env.example`, `docs/environment-variables.md`
3. Hosting project structure: `lib/pipeline/hosting/domains.ts`, `docs/deployment/website-hosting-integration.md`
4. Deployment integration: `lib/pipeline/adapters/vercel.ts`, `lib/pipeline/deployment.ts`
5. Preview hosting: `lib/pipeline/adapters/vercel.ts`, `lib/pipeline/workflow.ts`
6. Production hosting: `lib/publish/delivery.ts`, `lib/publish/workflow.ts`, `lib/pipeline/adapters/vercel.ts`
7. Domain/subdomain management: `lib/pipeline/hosting/domains.ts`, `lib/publish/delivery.ts`
8. SSL/security: `lib/pipeline/hosting/security.ts`, docs in this file
9. Status tracking: `lib/pipeline/types.ts`, `lib/pipeline/status.ts`, `lib/publish/state.ts`, `lib/publish/types.ts`, `lib/ai/structure/types.ts`
10. Logs/error handling: `lib/pipeline/hosting/logs.ts`, `lib/pipeline/adapters/vercel.ts`, `lib/pipeline/errors.ts`
11. Access control: existing guards retained in `lib/publish/permissions.ts`, `lib/publish/workflow.ts` (documented here)
12. Performance/scalability: existing SSG + cache flow documented here and in `docs/deployment/website-static-site-generation.md`
13. SSG integration: existing `PipelineBuildOutput` + `build.ssg` path in `lib/pipeline/build.ts`, `lib/pipeline/adapters/vercel.ts`
14. Publish/update integration: `lib/publish/delivery.ts`, `lib/publish/state.ts`, `lib/publish/workflow.ts`
15. Scenario/testing coverage: `lib/pipeline/hosting/scenarios.ts`, `lib/pipeline/scenarios.ts`, `docs/deployment/website-hosting-integration-tests.md`
16. Documentation: this file + related docs updates in deployment/publish/environment docs
