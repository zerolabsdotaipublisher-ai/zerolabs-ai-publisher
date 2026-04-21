# Website Deployment Updates (ZLAP-STORY 5-5)

## Purpose

Story 5-5 keeps website deployment updates inside AI Publisher's existing publish and deployment pipeline.

AI Publisher (Layer 1) owns:

- deployment update trigger analysis
- deployment update queue/concurrency metadata
- deployment version history and live-version tracking
- retry and rollback-ready metadata
- cache invalidation metadata tied to SSG output
- domain stability metadata for live website updates
- update observability/logging stored in publication metadata

ZeroFlow (Layer 2) remains out of scope for product-specific deployment update logic, deployment history, rollback state, and live routing/domain behavior.

## Requirements and workflow

Deployment updates are an extension of the existing publish/update lifecycle, not a second subsystem.

1. Draft edits continue to save into the current `WebsiteStructure` record.
2. Saved draft edits regenerate routing through the existing editor/routing path.
3. `lib/publish/versioning.ts` fingerprints the current structure and compares it to the last successful live fingerprint.
4. If deployment-relevant changes exist, publication state becomes `update_pending` and stores a typed pending update plan.
5. Publish and update buttons still call the existing `/api/publish` and `/api/publish/update` routes, which both use `runPublishWorkflow()`.
6. The workflow acquires an app-owned concurrency lock, uses optimistic persistence guards, and then runs the existing deployment adapter path.
7. Success promotes a new live version, updates history/cache/domain metadata, and clears pending state.
8. Failure preserves the prior live deployment metadata, records retryability, and leaves the update available for retry.

## What counts as an update

The update planner recognizes these deployment-relevant change kinds:

- `content`
- `structure`
- `layout`
- `seo`
- `routing`

The planner produces:

- `triggeredBy`: change categories plus optional `manual`
- `scope.pageIds`
- `scope.routePaths`
- `scope.assetPaths`
- `scope.fullSite`
- `scope.metadataOnly`

This lets MVP incremental deployment support remain metadata-driven while still reusing the current end-to-end deployment path.

## Versioning model

`WebsiteStructure.publication.updates` now stores app-owned deployment update metadata:

- `liveVersionId`
- `liveFingerprint`
- `pending`
- `queue`
- `current`
- `retry`
- `rollback`
- `cache`
- `domain`
- `staticSite`
- `history`
- `logs`

Each successful publish/update adds a `history[]` entry with:

- deployment version id
- structure version
- live flag
- deployment/provider ids
- update plan
- cache invalidation metadata
- domain snapshot
- SSG snapshot counts and affected paths
- rollback-ready metadata
- deployment logs

The current live version remains active until a new deployment succeeds.

## Trigger logic and no-op handling

`planDeploymentUpdate()` compares the current structure fingerprint to the last live fingerprint.

Behavior:

- first publish: always full-site deployment
- update with real differences: queue a deployment update
- update with no deployment-relevant differences: return a typed no-op result and keep the live deployment unchanged

This prevents unnecessary redeploys for manual update clicks when draft/live fingerprints are already aligned.

## Queue and concurrency handling

Deployment updates are protected by two app-owned guards:

1. in-process lock per `structure.id` (`lib/publish/queue.ts`)
2. optimistic persistence check on `updated_at` (`lib/publish/storage.ts`)

This keeps repeated clicks and overlapping requests deterministic without adding a separate queue service.

## Success, failure, retry, and rollback-ready behavior

### Success

On success AI Publisher:

- keeps the existing live path contract stable
- promotes a new `liveVersionId`
- appends version history
- records cache/domain/SSG metadata
- clears pending update state
- resets retry metadata

### Failure

On failure AI Publisher:

- preserves prior `liveUrl`, `livePath`, `liveVersionId`, and history
- stores `lastError`
- marks deployment status `failed`
- records retry metadata and update logs
- keeps pending update metadata available for retry

### Retry

Retry uses the same publish/update workflow and does not introduce a second recovery path.

### Rollback-ready MVP boundary

Rollback is metadata-only in MVP:

- version history identifies stable rollback candidates
- current/previous stable version ids are stored
- provider rollback orchestration is intentionally deferred

## SSG, cache, and domain consistency

Deployment updates reuse the existing SSG artifact from Story 5-2 and hosting/domain model from Stories 5-3 and 5-4.

- `lib/publish/delivery.ts` maps deployment results plus SSG route/asset counts into publication metadata.
- `lib/publish/cache.ts` converts update scope + SSG output into provider-neutral cache invalidation metadata.
- `normalizeDomainSnapshot()` preserves the live path/domain contract during updates.
- Routing/domain updates stay app-owned and continue to use the existing routing model.

## Logs and observability

Deployment update observability is stored in publication metadata and existing logs:

- `publication.deployment.logs`
- `publication.updates.logs`
- publish workflow request/error logs
- existing pipeline/hosting logs

Logged phases include:

- analysis
- queue
- deployment
- cache
- domain
- completion
- retry

## Access control

Owner-only access control remains unchanged:

- API auth still requires the current owner
- `canUserPublishWebsite()` remains the publish/update authorization guard
- no auth logic moved to hosting providers or ZeroFlow

## MVP boundaries

- deployment update logic stays inside AI Publisher
- no second deployment/update subsystem is introduced
- no queue service or provider-specific release platform is added
- rollback remains metadata-ready, not provider-orchestrated
- incremental support is scope metadata plus shared pipeline reuse
- update failures do not replace the stable live deployment
- raw environment access remains limited to `config/env.ts`
- deployment update logic does not move into `services/zeroflow`

## Task-to-file mapping (Tasks 1-17)

1. **Define deployment update requirements**: this document, `docs/deployment/website-deployment-updates-tests.md`
2. **Define deployment versioning model**: `lib/publish/types.ts`, `lib/ai/structure/types.ts`, `lib/publish/versioning.ts`, `lib/publish/model.ts`
3. **Implement update trigger logic**: `lib/publish/versioning.ts`, `lib/publish/detection.ts`, `lib/publish/state.ts`
4. **Integrate update flow with publish and update controls**: `lib/publish/workflow.ts`, `app/api/publish/route.ts`, `app/api/publish/update/route.ts`, `components/publish/publish-controls.tsx`
5. **Implement incremental deployment updates**: `lib/publish/versioning.ts`, `lib/publish/cache.ts`, `lib/publish/delivery.ts`
6. **Implement update queue and concurrency handling**: `lib/publish/queue.ts`, `lib/publish/storage.ts`, `lib/publish/workflow.ts`, `lib/publish/state.ts`
7. **Implement deployment update status tracking**: `lib/publish/types.ts`, `lib/publish/detection.ts`, `lib/publish/state.ts`, `lib/ai/structure/types.ts`
8. **Implement update success handling**: `lib/publish/workflow.ts`, `lib/publish/state.ts`, `lib/publish/delivery.ts`
9. **Implement update failure and retry handling**: `lib/publish/workflow.ts`, `lib/publish/state.ts`, `lib/publish/types.ts`
10. **Implement rollback mechanism (MVP-ready)**: `lib/publish/types.ts`, `lib/publish/state.ts`, this document
11. **Implement deployment update logs and monitoring**: `lib/publish/state.ts`, `lib/publish/types.ts`, `app/api/observability/events/route.ts`, `lib/pipeline/scenarios.ts`, `lib/pipeline/hosting/scenarios.ts`
12. **Integrate updates with static site generation**: `lib/publish/delivery.ts`, `lib/publish/cache.ts`, `lib/publish/versioning.ts`
13. **Implement cache invalidation and CDN refresh**: `lib/publish/cache.ts`, `lib/publish/state.ts`, this document
14. **Implement domain update handling**: `lib/publish/delivery.ts`, `lib/publish/state.ts`, `lib/pipeline/hosting/scenarios.ts`
15. **Implement access control for deployment updates**: `lib/publish/workflow.ts`, `lib/publish/permissions.ts`, API routes
16. **Test deployment update workflow**: `lib/publish/scenarios.ts`, `lib/pipeline/scenarios.ts`, `lib/pipeline/hosting/scenarios.ts`, `docs/deployment/website-deployment-updates-tests.md`
17. **Document deployment update system**: this document, `docs/deployment/website-deployment-updates-tests.md`, linked deployment docs
