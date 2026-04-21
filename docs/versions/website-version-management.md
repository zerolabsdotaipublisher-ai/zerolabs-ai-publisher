# Website Version Management (ZLAP-STORY 5-6)

## Purpose

Website version management stays inside AI Publisher as product-owned state and workflow.

AI Publisher owns:

- version snapshot creation for reconstructable `WebsiteStructure` state
- version storage and retrieval
- version history listing and restore behavior
- version status, readable version numbering, and audit metadata
- deployment-to-version linkage for published/live states

ZeroFlow remains out of scope for website version history ownership, version snapshots, restore operations, and product-specific metadata.

## Requirements

Versions are created for these deterministic product events:

1. **Draft save** — editor saves create a draft snapshot after the `WebsiteStructure`, routing, navigation, and SEO metadata persist successfully.
2. **Publish** — successful initial publishes create a published/live snapshot linked to deployment metadata.
3. **Deployment update** — successful update publishes create a new published/live snapshot linked to the new deployment metadata.
4. **Restore** — restoring a previous version creates a new restored working-draft snapshot after the current `WebsiteStructure` is safely rewritten.

Users interact with versions through:

- owner-only API routes under `app/api/versions/*`
- version history listing in the generated-site owner view
- restore-to-draft actions that keep live deployment metadata separate until the next publish/update

## Version data model

`website_versions` is a product-owned table with:

- `id`
- `structure_id`
- `user_id`
- `version_number`
- `label`
- `status`
- `source`
- `structure_version`
- full `snapshot`
- `fingerprint` and `summary` metadata for comparison and retrieval efficiency
- optional `deployment` linkage
- optional `comparison` summary metadata
- `is_live` and `is_current_draft` flags
- optional `restored_from_version_id`
- `audit`
- timestamps

`lib/versions/types.ts` keeps the typed app model aligned with the persisted record.

## Snapshot creation

`lib/versions/snapshots.ts` validates the `WebsiteStructure` before any snapshot is stored.

Each snapshot stores:

- the full reconstructable `WebsiteStructure`
- a typed publication fingerprint reused from the publish pipeline
- summary counts for pages, routes, and assets

This keeps MVP storage based on full snapshots while still leaving room for later diff/compression work.

## Storage and retrieval

`lib/versions/storage.ts` provides product-owned helpers to:

- create version records
- retrieve a version by website and version id
- list version history per website

The migration adds `public.insert_website_version(...)`, which keeps version numbering and live/current-draft flag transitions atomic per website by using an advisory transaction lock.

## Status model

Version status is intentionally MVP-light:

- `draft`
- `published`
- `archived`
- `restored`

Additional meaning comes from flags:

- `is_live` identifies the currently live published version
- `is_current_draft` identifies the current working draft snapshot

Only one live version and one current-draft version are kept per website.

## Restore flow

Restore is safe and auditable:

1. Load the owned current `WebsiteStructure`.
2. Load and validate the requested version snapshot.
3. Compare the current draft to the stored fingerprint.
4. Rebuild the working `WebsiteStructure` from the snapshot while preserving current publication metadata ownership.
5. Regenerate routing and re-run draft validation.
6. Persist the restored `WebsiteStructure`, navigation, and SEO metadata.
7. Create a new `restored` version record with audit linkage to the source version.

Restore does **not** directly swap provider deployments. A restore only changes the current working draft; publish/update still mediates live deployment changes.

## Deployment integration

Publish/update flows reuse existing deployment metadata rather than introducing a second deployment history system.

Published version records store:

- deployment ids
- provider deployment ids
- environment/status/target
- live URL/path
- domains
- existing publication version id linkage

This keeps version history aligned with the existing publish/pipeline model from Stories 5-1 through 5-5.

## Audit trail and observability

Each version record stores structured audit entries for:

- snapshot creation
- restore creation
- status assignment

Publish and editor flows continue to log through existing observability paths, so version metadata and workflow logs remain correlated.

## Version listing and comparison

The MVP UI shows:

- version number and label
- timestamp
- version status
- source event
- live/current-draft flags
- deployment identifiers when present
- lightweight comparison summary against the current draft
- restore action

Comparison stays MVP-light by reusing `planDeploymentUpdate()` with the stored version fingerprint. No Git-like diff engine is added.

## Access control

Only the website owner can:

- list version history
- retrieve version details
- restore a version

Ownership checks reuse the existing authenticated user and `getWebsiteStructure(..., user.id)` pattern. Version logic does not move into `services/zeroflow`.

## MVP boundaries

- Version management remains inside AI Publisher.
- No platform-wide version service is introduced.
- Full snapshots are used for MVP storage; diff/compression remains future work.
- Comparison is a typed summary, not a visual Git-style diff.
- Restore is safe and auditable, but live deployment rollback still flows through publish/update.
- Existing `WebsiteStructure`, editor save, routing, SSG, hosting, and deployment flows remain the primary system of record.

## Task-to-file mapping (Tasks 1-16)

1. **Define version management requirements**: this document, `docs/versions/website-version-management-tests.md`
2. **Define versioning data model**: `lib/versions/types.ts`, `supabase/migrations/20260421010000_website_version_management.sql`
3. **Implement version snapshot creation**: `lib/versions/snapshots.ts`
4. **Integrate version creation with edit and publish flows**: `lib/editor/storage.ts`, `lib/publish/workflow.ts`
5. **Implement version storage and retrieval**: `lib/versions/storage.ts`, `app/api/versions/route.ts`, `app/api/versions/[versionId]/route.ts`
6. **Implement version listing interface**: `components/versions/version-history-panel.tsx`, `app/(app)/generated-sites/[id]/page.tsx`
7. **Implement version comparison (MVP)**: `lib/versions/compare.ts`, `components/versions/version-history-panel.tsx`
8. **Implement version restoration (rollback)**: `lib/versions/restore.ts`, `app/api/versions/restore/route.ts`
9. **Implement version status management**: `lib/versions/types.ts`, `lib/versions/status.ts`, migration function
10. **Implement version naming and identification**: `lib/versions/model.ts`, migration function
11. **Implement version access control**: API routes, `lib/versions/storage.ts`, `lib/versions/restore.ts`
12. **Optimize version storage and performance**: snapshot summary/fingerprint in `lib/versions/snapshots.ts`, indexed table columns in migration
13. **Integrate version management with deployment pipeline**: `lib/publish/workflow.ts`, `lib/versions/types.ts`
14. **Implement version logs and audit trail**: `lib/versions/audit.ts`, `lib/versions/storage.ts`, `lib/versions/restore.ts`
15. **Test version management system**: `lib/versions/scenarios.ts`, `docs/versions/website-version-management-tests.md`
16. **Document website version management system**: this document, `docs/versions/website-version-management-tests.md`
