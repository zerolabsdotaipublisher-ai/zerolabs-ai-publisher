# Website Build and Deployment Pipeline

ZLAP-STORY 5-1 adds a Layer 1 pipeline under `lib/pipeline/`. AI Publisher owns orchestration; ZeroFlow is not involved in website build or deployment execution.

## Runtime Flow

1. Validate the existing `WebsiteStructure`.
2. Validate SSG readiness for visible pages, static route coverage, metadata, assets, and output shape.
3. Compile it into a renderable build manifest that points at the existing generated-site renderer.
4. Attach an SSG artifact with static page data, routes, cache policy, output manifest, and validation metadata.
5. Select a deployment adapter from config.
6. Assign the existing preview or live route URL.
7. Return a typed deployment status record.
8. Publish delivery persists the current production deployment status in publication metadata.

## Adapters

`mock` is the default target and performs no external calls.

`vercel` supports MVP-safe hosting integration:

- safe dry-run behavior by default
- optional real programmatic deployment trigger mode via configured deploy hooks
- preview and production environment separation
- typed domain/security/log metadata in deployment responses

Supported targets are configured with:

```text
PIPELINE_DEPLOYMENT_TARGET=mock
PIPELINE_PREVIEW_BASE_URL=http://localhost:3000
PIPELINE_PRODUCTION_BASE_URL=http://localhost:3000
PIPELINE_MAX_ATTEMPTS=3
PIPELINE_RETRY_BASE_DELAY_MS=100
```

All environment access goes through `config/env.ts` and `config.services.pipeline`.

## Publish Integration

`lib/publish/delivery.ts` now calls `deployWebsiteProduction()`. The publish workflow still owns permission checks, publish eligibility, storage, and publication state transitions. The pipeline only builds, assigns URLs, deploys via an adapter, and reports status.

## Preview Deployment

Preview deployment is exposed as `deployWebsitePreview()`. It reuses the existing preview route, `/preview/{id}`, and the same build/deployment adapter abstraction.

The preview build also emits SSG-ready route and page artifacts. The current preview UI remains live and authenticated; the static artifacts validate the generated website output that a deployment adapter can later publish.

## Static Site Generation

Story 5-2 adds `lib/pipeline/ssg/` as a Layer 1 pipeline module. It keeps SSG ownership in AI Publisher and extends the existing build output instead of creating a second pipeline.

The SSG artifact includes:

- static generation strategy
- visible-page route manifest
- minimized page data for each static page
- metadata/SEO for each page
- asset reference manifest
- provider-neutral cache policy
- expected static output file layout
- typed validation result and metrics

See [website-static-site-generation.md](./website-static-site-generation.md) for architecture details and [website-static-site-generation-tests.md](./website-static-site-generation-tests.md) for validation scenarios.

## Idempotency

The pipeline derives its idempotency key from deployment target, environment, structure id, structure version, and a hash of renderable structure content. Re-running the same deployment input produces the same build id and deployment id.

## Observability

Pipeline events are logged through `lib/observability` and can also be observed by passing a `PipelineObserver`. Retry scheduling, SSG start/completion/failure, build completion, deployment completion, and deployment failure are emitted as structured events.

## Boundaries

- No pipeline code lives in `services/zeroflow`.
- No new website model is introduced; the build artifact wraps the existing `WebsiteStructure`.
- No second deployment system is introduced; Story 5-3 extends the existing adapter path.
- No provider-specific CDN behavior or ISR revalidation is enabled in Story 5-2.
- Persistent deployment history is not added; the current production deployment status is stored in publication metadata.
