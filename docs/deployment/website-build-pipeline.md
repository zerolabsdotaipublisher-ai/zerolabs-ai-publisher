# Website Build and Deployment Pipeline

ZLAP-STORY 5-1 adds a Layer 1 pipeline under `lib/pipeline/`. AI Publisher owns orchestration; ZeroFlow is not involved in website build or deployment execution.

## Runtime Flow

1. Validate the existing `WebsiteStructure`.
2. Compile it into a renderable build manifest that points at the existing generated-site renderer.
3. Select a deployment adapter from config.
4. Assign the existing preview or live route URL.
5. Return a typed deployment status record.
6. Publish delivery persists the current production deployment status in publication metadata.

## Adapters

`mock` is the default target and performs no external calls.

`vercel` is present as an MVP-safe dry-run adapter. It uses the same interface and URL assignment rules as a real adapter, but it does not call Vercel APIs yet.

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

## Idempotency

The pipeline derives its idempotency key from deployment target, environment, structure id, structure version, and a hash of renderable structure content. Re-running the same deployment input produces the same build id and deployment id.

## Observability

Pipeline events are logged through `lib/observability` and can also be observed by passing a `PipelineObserver`. Retry scheduling, build completion, deployment completion, and deployment failure are emitted as structured events.

## Boundaries

- No pipeline code lives in `services/zeroflow`.
- No new website model is introduced; the build artifact wraps the existing `WebsiteStructure`.
- No real deployment is performed in the MVP adapters.
- Persistent deployment history is not added; the current production deployment status is stored in publication metadata.
