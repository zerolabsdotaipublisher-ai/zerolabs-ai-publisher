# Website Deployment Updates Tests (ZLAP-STORY 5-5)

## Scenario catalogs

- `lib/publish/scenarios.ts`
- `lib/pipeline/scenarios.ts`
- `lib/pipeline/hosting/scenarios.ts`

## Required workflow scenarios

1. **Successful update after draft changes**
   - publish once
   - save draft content/structure/layout changes
   - verify `publication.updates.pending` is populated
   - run update
   - verify new `liveVersionId`, new history entry, and cleared pending update metadata

2. **No-op update when nothing changed**
   - start from a published structure whose live fingerprint matches the draft
   - trigger update
   - verify `didDeploy=false`, no new live version, and current live URL remains unchanged

3. **Update failure preserves previous live version**
   - force adapter failure
   - verify `state=update_failed`, `deployment.status=failed`, and previous `liveVersionId/liveUrl/livePath` remain intact

4. **Retry after failure**
   - retry the failed update path
   - verify retry metadata increments and clears after success

5. **Concurrent update requests**
   - trigger overlapping update requests for the same structure
   - verify one request is rejected or conflict-protected without creating overlapping live deployments

6. **Routing change update**
   - rename a page slug or add redirect-generating route changes
   - verify routing appears in the update scope and domain snapshot remains stable

7. **Metadata-only update**
   - change SEO fields only
   - verify `metadataOnly=true` and cache invalidation metadata targets only affected paths

8. **Version history and rollback-ready metadata**
   - perform at least two successful deployment updates
   - verify `history[]`, `rollback.currentVersionId`, and `rollback.previousStableVersionId`

9. **Cache invalidation metadata**
   - verify `publication.updates.cache` records strategy, provider, affected routes, and asset paths after successful deploy

## Manual verification commands

Run from the repository root:

```bash
npm install
npm run lint
NEXT_PUBLIC_APP_NAME='AI Publisher' \
NEXT_PUBLIC_APP_URL='http://localhost:3000' \
NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co' \
NEXT_PUBLIC_SUPABASE_ANON_KEY='anon-key' \
SUPABASE_SERVICE_ROLE_KEY='service-role-key' \
OPENAI_API_KEY='openai-key' \
npm run build
rg "process\\.env" -n --glob '!docs/**'
rg "services/zeroflow|services\\\\zeroflow" lib/publish lib/pipeline
rg "runPublishWorkflow|deployWebsiteProduction|deployWebsitePreview" lib/publish lib/pipeline app/api/publish
```

Expected results:

- `npm install` succeeds
- `npm run lint` succeeds
- `npm run build` succeeds with required env vars present
- raw `process.env` access remains limited to `config/env.ts`
- deployment update logic has no dependency on `services/zeroflow`
- updates still run through the existing publish + pipeline entry points

## Boundary regression checks

- no second deployment/update subsystem is introduced
- update ownership remains in AI Publisher
- rollback stays metadata-ready, not fully orchestrated
- failed updates preserve the stable live deployment
- incremental update support remains metadata-driven for MVP
- SSG, hosting, and routing integrations continue to share the existing pipeline path
