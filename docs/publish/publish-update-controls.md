# Publish and Update Controls (ZLAP-STORY 4-5)

## Purpose and scope

Story 4-5 adds publication lifecycle controls on top of existing generated website records, editor drafts, and preview flows.

This implementation:

- reuses existing `WebsiteStructure` storage
- introduces typed publication metadata and transition rules
- adds publish/update controls to editor and preview owner surfaces
- integrates publish actions with product-owned delivery URL assignment
- adds validation, permissions, status indicators, timestamps, tracking, and recovery states

## Workflow requirements

### Draft vs published workflow

1. Website starts in draft publication state.
2. User saves draft edits in editor.
3. User publishes saved draft to create a live URL.
4. Further saved draft edits become unpublished changes until user runs update.

### First publish vs update workflow

- **First publish**: available when website was never published.
- **Update**: available only when website has an existing published version.
- Update acts on latest **saved** draft changes, not unsaved local edits.

### Control visibility and behavior

- Publish controls appear in owner editor and owner preview.
- Status badges appear in editor/preview controls and generated-site view.
- Publish action is blocked for:
  - unsaved editor edits
  - failed eligibility checks
  - update attempts with no unpublished saved changes

### Success and failure expectations

- Success shows confirmation, live URL, and publication timestamps.
- Failure preserves draft data, marks update as failed, and exposes retry.

## Publication model

`WebsiteStructure.publication` (product-owned metadata):

- `state`: `draft | publishing | published | update_pending | update_failed | unpublished`
- `publishedVersion`
- `liveUrl`, `livePath`
- `firstPublishedAt`, `lastPublishedAt`
- `lastDraftUpdatedAt`
- `lastPublishAttemptAt`
- `lastUpdatedAt`
- `lastError`

Transition rules are centralized in `lib/publish/transitions.ts`.

## Unsaved vs unpublished logic

- **Unsaved changes**: editor local dirty state (`lib/editor/dirty.ts`) and `state.dirty` in editor shell.
- **Unpublished changes**: saved draft version is newer than `publication.publishedVersion` (`lib/publish/detection.ts`).

## Validation and safeguards

`lib/publish/validation.ts` validates publish eligibility:

- required site title/pages/visible sections
- slug validity + uniqueness
- required SEO metadata
- non-empty primary navigation
- archived status guard

Confirmation dialog communicates live impact before publish/update.

## Delivery integration and live URL handling

`lib/publish/delivery.ts` and `lib/publish/urls.ts` provide a product-owned delivery adapter that:

- builds live path from existing generated-site route
- generates absolute live URL using config layer
- returns deployment metadata for future delivery system expansion

## Access control

`lib/publish/permissions.ts` enforces owner-only publish/update actions.

Both UI and API are owner-scoped through existing auth + ownership checks.

## Tracking and observability

- Client tracking helper: `lib/publish/tracking.ts`
- Event API allowlist extended in `app/api/observability/events/route.ts`
- Events: `publish_started`, `publish_completed`, `publish_failed`, `publish_retry_clicked`, `update_completed`

## API routes

- `POST /api/publish` (first publish)
- `POST /api/publish/update` (update live website)
- `GET /api/publish/status` (state + eligibility)

## UI components

- `components/publish/publish-controls.tsx`
- `components/publish/publish-status-badge.tsx`
- `components/publish/publish-confirmation-dialog.tsx`
- `components/publish/publish-loading-state.tsx`
- `components/publish/publish-success-state.tsx`
- `components/publish/publish-error-state.tsx`
- `components/publish/live-link-card.tsx`

Integrated in:

- `components/editor/website-editor-shell.tsx`
- `components/preview/website-preview-shell.tsx`
- `app/(app)/generated-sites/[id]/page.tsx`

## Non-goals

- no second website record model
- no platform-layer ownership drift
- no full custom-domain management

## Future extension path

- swap delivery adapter internals to real deployment provider
- add role-based publish permissions beyond owner-only
- add custom domain mapping atop `liveUrl/livePath` metadata
