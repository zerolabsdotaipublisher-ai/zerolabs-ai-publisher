# Manual Publishing Override (ZLAP-STORY 9-6)

## Scope

This story adds an AI Publisher-owned manual publishing override flow for urgent operational interventions.

Architecture alignment:

- Override logic is implemented in AI Publisher (`app/api`, `lib/publish`, `components/publish`).
- Existing publish, schedule, approval, revision, and social publishing systems are reused.
- No override workflow logic is moved to `services/zeroflow`.
- No raw `process.env` access is added outside config layers.
- MVP adds safe manual override behavior, not policy-engine orchestration.

## Manual override requirements

Manual override supports:

- websites/pages
- blog posts
- articles
- social posts (Instagram path supported by existing social publish route stack)

Required operator inputs:

- override scenario (`urgent_publish`, `hotfix_update`, `bypass_scheduled_time`, `bypass_approval`)
- override reason (required, min length enforced)
- optional approval bypass toggle (server-authorized only)

Safeguards:

- explicit confirmation dialog with warning
- server-side permission checks
- server-side approval gate checks unless approved bypass
- schedule de-duplication updates to avoid duplicate scheduled execution

## Permissions and roles

`lib/publish/override/permissions.ts` resolves override permissions from owner + metadata roles:

- `owner`
- `admin`
- `authorized_approver`

Enforcement:

- Override use requires owner/admin/authorized approver.
- Approval bypass requires admin/authorized approver.
- API always enforces access regardless of UI state.

## Override state and flags

Override status metadata is stored in existing publication metadata:

- `overrideUsed`
- `overrideReason`
- `overrideTimestamp`
- `overrideUserId`
- `bypassedWorkflows`
- `targetContentId`
- `targetContentType`
- `scenario`
- `approvalBypassed`
- `requestId`

Durable audit trail is stored in `public.publish_manual_override_audit` (migration included).

## Workflow integration

### Publishing pipeline integration

- Website/blog/article override reuses `runPublishWorkflow` (no duplicate publish pipeline).
- Action (`publish` vs `update`) is resolved from current publication detection.

### Scheduling integration

- Website content schedules are paused/cleared when override executes immediately.
- Social schedules for the target social post are canceled/cleared when override executes.

### Approval integration

- Structure-wide approval gate is still enforced unless authorized bypass is requested.
- Per-content approval state is enforced for contentId-based overrides unless authorized bypass.
- Bypass metadata is persisted and audited.

### Revisions/history/audit/notifications

- Existing publish workflow revision snapshots remain intact for website/blog/article paths.
- Social override can record revision metadata for content-id scoped actions.
- Audit row is written to `publish_manual_override_audit` for each override.
- Notification/event hook logs `manual publish override used` through observability logger.

## UI/UX

Added components:

- `components/publish/manual-override-button.tsx`
- `components/publish/manual-override-dialog.tsx`
- `components/publish/manual-override-status.tsx`

Integrated in publish surfaces:

- `components/publish/publish-controls.tsx` (editor + preview owner flows)
- `app/(app)/generated-sites/[id]/page.tsx` (status indicator)

UX behavior:

- manual override button alongside publish/update controls
- required reason and scenario inputs
- optional bypass approval toggle (disabled when role cannot bypass)
- loading/success/error states
- status indicator for latest manual override metadata

## Error handling and access control

`POST /api/publish/override` handles:

- unauthorized requests (401)
- invalid payloads (400)
- forbidden role/bypass actions (403)
- missing resources (404)
- workflow gate conflicts (409)
- execution failures (422)

## MVP boundaries

- No enterprise policy engine / no multi-tenant workflow policies.
- No new independent publish pipeline.
- No migration of override logic to external services.
- Social override currently targets the existing Instagram publish-supported path.

## Exact task-to-file mapping (all 18 tasks)

1. Define Manual Override Requirements  
   - `docs/publish/manual-publishing-override.md`, `lib/publish/override/scenarios.ts`
2. Define Override Permissions and Roles  
   - `lib/publish/override/permissions.ts`, `app/api/publish/status/route.ts`
3. Define Override State and Flag Model  
   - `lib/publish/override/types.ts`, `lib/publish/types.ts`, `lib/publish/status/types.ts`
4. Design Manual Override UI/UX  
   - `components/publish/manual-override-button.tsx`, `components/publish/manual-override-dialog.tsx`, `components/publish/manual-override-status.tsx`
5. Implement Override Control in UI  
   - `components/publish/publish-controls.tsx`, `components/publish/manual-override-button.tsx`
6. Implement Override Confirmation and Safeguards  
   - `components/publish/manual-override-dialog.tsx`, `lib/publish/override/schema.ts`
7. Implement Backend Override Logic  
   - `app/api/publish/override/route.ts`, `lib/publish/override/workflow.ts`
8. Integrate Override with Publishing Pipeline  
   - `lib/publish/override/workflow.ts` (reuses `runPublishWorkflow`)
9. Integrate Override with Scheduling System  
   - `lib/publish/override/workflow.ts` (content/social schedule updates)
10. Integrate Override with Approval Workflow  
    - `lib/publish/override/workflow.ts`, `lib/publish/override/permissions.ts`
11. Implement Override Logging and Audit Trail  
    - `lib/publish/override/audit.ts`, `supabase/migrations/20260507120000_publish_manual_override_audit.sql`
12. Implement Override Status Indicators  
    - `components/publish/manual-override-status.tsx`, `lib/publish/status/model.ts`, `app/(app)/generated-sites/[id]/page.tsx`
13. Implement Error Handling for Override Actions  
    - `app/api/publish/override/route.ts`, `lib/publish/override/workflow.ts`, `components/publish/publish-controls.tsx`
14. Implement Access Control Enforcement  
    - `lib/publish/override/permissions.ts`, `lib/publish/override/workflow.ts`, `app/api/publish/status/route.ts`
15. Implement Notifications for Override Events  
    - `lib/publish/override/notifications.ts`, `lib/publish/override/workflow.ts`, `app/api/observability/events/route.ts`
16. Test Manual Override Across Scenarios  
    - `lib/publish/override/scenarios.ts`, `docs/publish/manual-publishing-override-tests.md`
17. Optimize Performance of Override Execution  
    - `lib/publish/override/workflow.ts` (targeted ownership lookups + existing workflow reuse)
18. Document Manual Publishing Override Feature  
    - `docs/publish/manual-publishing-override.md`, `docs/publish/manual-publishing-override-tests.md`

## Merge readiness

Ready for merge: **Pending validation** (`npm run lint`, `npm run build`, and parallel validation must pass on the updated branch).
