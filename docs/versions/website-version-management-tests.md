# Website Version Management Test Scenarios

## Scenario coverage

`lib/versions/scenarios.ts` defines the core MVP scenarios:

- draft save version creation
- publish version creation
- version history retrieval
- restore previous version
- comparison summary
- live version uniqueness
- deployment linkage

## Manual verification

1. Save a website draft and confirm a new `draft` version appears with `is_current_draft=true`.
2. Publish the website and confirm a new `published` version appears with `is_live=true` and deployment metadata.
3. Save another draft change and confirm the previous current-draft version becomes archived.
4. Open generated-site details and confirm the version history list shows readable version numbers, labels, timestamps, status, comparison summary, and restore action.
5. Restore an older version and confirm:
   - the current `WebsiteStructure` content matches the selected snapshot
   - routing regenerates successfully
   - a new `restored` version is recorded
   - live deployment metadata remains unchanged until the next publish/update
6. Publish after restore and confirm the new published version becomes the sole live version.
7. Query `/api/versions?structureId=<id>` and `/api/versions/<versionId>?structureId=<id>` as the owner and confirm records are returned.
8. Repeat the same API requests as a different user and confirm access is denied or the structure/version is not found.

## Validation commands

```bash
npm run lint
NEXT_PUBLIC_APP_NAME="AI Publisher" \
NEXT_PUBLIC_APP_URL="http://localhost:3000" \
NEXT_PUBLIC_SUPABASE_URL="https://example.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="test-anon-key" \
SUPABASE_SERVICE_ROLE_KEY="test-service-role-key" \
OPENAI_API_KEY="test-openai-key" \
npm run build
rg "process\.env" -n --glob '!docs/**'
rg "services/zeroflow" lib/versions lib/editor lib/publish
```

## Expected boundaries

- Version management stays product-owned in AI Publisher.
- No raw `process.env` access is introduced outside `config/env.ts` and `config/services.ts`.
- No `services/zeroflow` dependency appears in version logic.
- Comparison remains summary-based for MVP.
- Restore updates the working draft safely; live rollback still uses publish/update.
