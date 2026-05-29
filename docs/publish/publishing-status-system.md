# Publishing Status System (ZLAP-STORY 8-3)

## Scope

This story adds a unified website publishing status display system across website listing, dashboard, editor, preview, and generated-site surfaces.

Architecture alignment:

- Publishing status logic is implemented in AI Publisher under `lib/publish/status/*` and UI/app routes.
- Existing publish/deployment/versioning/website-management/dashboard/editor systems are reused.
- No publishing status lifecycle logic was moved into `services/zeroflow`.
- No raw `process.env` usage was added outside `config/env.ts` and `config/services.ts`.
- MVP focuses on status display/behavior and status retrieval, not a new publish workflow.

## Unified UI status states

Unified UI states:

- `draft`
- `publishing`
- `updating`
- `live`
- `unpublished_changes`
- `failed`
- `archived`
- `deleted`

Friendly labels:

- Draft
- Publishing
- Live
- Updates pending
- Failed
- Archived
- Deleted

## Data model

Primary model: `PublishingStatusModel` in `lib/publish/status/types.ts`.

Model includes:

- unified UI state/label
- mapped backend lifecycle status (`WebsiteStructure.status`, publication state, deployment status)
- publish detection and validation snapshots reused from existing publish modules
- timestamps (`lastUpdatedAt`, `lastPublishedAt`, `lastDraftUpdatedAt`)
- unpublished changes indicator
- transitional/failure metadata
- status-based action model (`publish`/`update`, action label, disable reason)

## Mapping and derivation

- Backend to UI state mapping: `lib/publish/status/mapping.ts`
- Status model builder: `lib/publish/status/model.ts`
- Owner-scoped retrieval: `lib/publish/status/storage.ts`
- Scenario catalog: `lib/publish/status/scenarios.ts`

Mapping behavior highlights:

- `published` backend state maps to `live`
- `update_pending` maps to `unpublished_changes`
- `update_failed` maps to `failed`
- active publishing with deployment `updating` maps to `updating`
- archived/deleted structure state overrides publish lifecycle display state

## UI integration

- Reusable badge: `components/publish/publish-status-badge.tsx`
- Reusable summary: `components/publish/publish-status-summary.tsx`

Integrated in:

- website listing cards (`components/management/website-list-item.tsx`)
- dashboard website summary (`components/dashboard/dashboard-website-summary.tsx`)
- editor/preview publish controls (`components/publish/publish-controls.tsx`)
- generated site page (`app/(app)/generated-sites/[id]/page.tsx`)

## API and near-real-time behavior

- Status API: `GET /api/publish/status` (`app/api/publish/status/route.ts`)
- Ownership enforced server-side via authenticated user + owned structure lookup
- Lightweight polling:
  - publish controls poll `/api/publish/status`
  - website listing polls `/api/websites/list`
  - dashboard polls `/api/dashboard/summary`

This keeps retrieval efficient for listing/dashboard (no per-card status API fan-out).

## Status-based behavior

- Publish/update button disabled when:
  - publishing/updating in progress
  - archived/deleted
  - validation fails
  - editor has unsaved changes
  - update requested but no unpublished saved changes
- “Publish updates” label appears when unpublished changes exist
- Failure state shows status error message

## MVP boundaries

- No replacement of existing publish workflow orchestration (`lib/publish/workflow.ts` remains source of publish execution)
- No provider-specific new deployment orchestration
- No workspace/tenant model changes
- No new ZeroFlow publishing lifecycle service

## Exact task-to-file mapping (all 18 tasks)

1. Define Publishing Status Requirements  
   - `docs/publish/publishing-status-system.md`
2. Define Publishing Status Data Model  
   - `lib/publish/status/types.ts`, `lib/publish/status/model.ts`
3. Map Backend Status to UI States  
   - `lib/publish/status/mapping.ts`
4. Design Publishing Status UI Components  
   - `components/publish/publish-status-badge.tsx`, `components/publish/publish-status-summary.tsx`, `app/globals.css`
5. Implement Status Badge Component  
   - `components/publish/publish-status-badge.tsx`
6. Integrate Status Display in Website Listing  
   - `lib/management/model.ts`, `lib/management/types.ts`, `components/management/website-list-item.tsx`, `components/management/website-status-badge.tsx`, `components/management/website-list-controls.tsx`, `app/api/websites/list/route.ts`
7. Integrate Status Display in Dashboard Overview  
   - `lib/dashboard/model.ts`, `lib/dashboard/types.ts`, `components/dashboard/dashboard-website-summary.tsx`
8. Integrate Status Display in Editor and Preview  
   - `components/publish/publish-controls.tsx` (shared by editor and preview)
9. Display Last Published and Last Updated Timestamps  
   - `components/publish/publish-status-summary.tsx`, `components/management/website-list-item.tsx`, `components/dashboard/dashboard-website-summary.tsx`
10. Implement Unpublished Changes Indicator  
    - `lib/publish/status/model.ts`, `components/publish/publish-status-summary.tsx`, `components/publish/publish-controls.tsx`
11. Implement Real-Time or Near-Real-Time Status Updates  
    - `components/publish/publish-controls.tsx`, `components/management/website-management-shell.tsx`, `components/dashboard/dashboard-home.tsx`
12. Implement Loading and Transitional States  
    - `components/publish/publish-controls.tsx`, `components/publish/publish-status-summary.tsx`
13. Implement Error and Failure Status Display  
    - `lib/publish/status/model.ts`, `components/publish/publish-status-summary.tsx`, `components/publish/publish-controls.tsx`
14. Implement Status-Based UI Behavior  
    - `lib/publish/status/model.ts`, `components/publish/publish-controls.tsx`, `components/management/website-list-item.tsx`
15. Implement Access Control for Status Visibility  
    - `lib/publish/status/storage.ts`, `app/api/publish/status/route.ts`
16. Test Publishing Status Across Scenarios  
    - `lib/publish/status/scenarios.ts`, `docs/publish/publishing-status-tests.md`
17. Optimize Performance of Status Retrieval  
    - `lib/management/model.ts`, `components/management/website-management-shell.tsx`, `components/dashboard/dashboard-home.tsx`
18. Document Publishing Status System  
    - `docs/publish/publishing-status-system.md`, `docs/publish/publishing-status-tests.md`
