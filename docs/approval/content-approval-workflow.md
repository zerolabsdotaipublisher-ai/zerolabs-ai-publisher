# Content Approval Workflow (ZLAP-STORY 9-3)

This story adds the content approval workflow MVP inside AI Publisher and aligns with EPIC 9 Story 9-1 (review interface) and Story 9-2 (editing system).

## Architecture alignment

- Approval workflow logic lives in AI Publisher (`app`, `lib`, `components`) and not in `services/zeroflow`.
- Existing review, editing, publishing, versioning, dashboard, notifications, and ownership systems are reused.
- Publishing pipeline remains the existing pipeline; approval adds a gate, not a duplicate pipeline.
- No raw `process.env` usage is introduced outside config layer.

## Supported content

- website/page content
- blog posts
- articles
- social posts

## Approval state model

Approval states:

- `draft`
- `pending_approval`
- `approved`
- `rejected`
- `needs_changes`
- `published`

Persistence reuses Story 9-1 review decision storage (`ai_content_reviews`) and maps `pending_review` to approval-facing `pending_approval`.

## Roles and permissions

Role concepts surfaced in workflow metadata:

- `creator`
- `reviewer`
- `approver`

MVP remains owner-scoped and enforces server-side ownership checks for every approval endpoint.

## UI/UX scope

Routes:

- `/approval`
- `/approval/[contentId]`

UI capabilities:

- approval queue filters/search/sort/status indicators
- submit-for-approval action
- approve/reject/request-changes actions
- lightweight comments + feedback thread
- loading, transitional, and error states
- integration links to review/editor/preview

## API surface

- `GET /api/approval`
- `GET /api/approval/[contentId]`
- `POST /api/approval/[contentId]/submit`
- `POST /api/approval/[contentId]/approve`
- `POST /api/approval/[contentId]/reject`
- `POST /api/approval/[contentId]/request-changes`
- `POST /api/approval/[contentId]/comment`

## Workflow integrations

- Editing integration: existing Story 9-2 edit-save review re-entry behavior remains and supports resubmission.
- Publishing integration: `POST /api/publish` and `POST /api/publish/update` now block when linked content is not approved/published.
- Dashboard/content library/review/editor surfaces show approval state indicators.
- Notifications: lightweight event hooks for submitted/approved/rejected/changes-requested via observability logger.
- Audit logging: approval actions/comments are persisted in `ai_content_approval_audit`.

## Performance approach

- Approval list/detail reuse existing aggregated content-library retrieval.
- Approval decision lookup uses one owner-scoped record pull and map lookup per request pass.
- Publishing gate checks linked content states in one bounded server pass.

## MVP boundaries

- Owner-scoped approval workflow only; no collaborative workspace model.
- Lightweight comments/feedback thread only.
- Single-level decisioning in MVP; multi-level approval is future-ready and documented only.
- Not an enterprise compliance suite.

## Task-to-file mapping (all 21 tasks)

1. Define Content Approval Workflow Requirements  
   - `docs/approval/content-approval-workflow.md`, `lib/approval/scenarios.ts`
2. Define Approval State Model  
   - `lib/approval/types.ts`, `lib/approval/schema.ts`, `lib/content/library/model.ts`
3. Define Roles and Permissions for Approval  
   - `lib/approval/types.ts`, `lib/approval/permissions.ts`, `lib/approval/workflow.ts`
4. Design Approval Workflow UI/UX  
   - `components/approval/approval-shell.tsx`, `components/approval/approval-list.tsx`, `components/approval/approval-action-bar.tsx`
5. Implement Approval Workflow Engine  
   - `lib/approval/workflow.ts`, `lib/approval/model.ts`
6. Implement Submit for Approval Action  
   - `app/api/approval/[contentId]/submit/route.ts`, `lib/approval/workflow.ts`, `components/approval/approval-action-bar.tsx`
7. Implement Approval and Rejection Actions  
   - `app/api/approval/[contentId]/approve/route.ts`, `app/api/approval/[contentId]/reject/route.ts`, `lib/approval/workflow.ts`
8. Implement Request Changes Workflow  
   - `app/api/approval/[contentId]/request-changes/route.ts`, `lib/approval/workflow.ts`
9. Implement Commenting and Feedback System  
   - `app/api/approval/[contentId]/comment/route.ts`, `components/approval/approval-comment-panel.tsx`, `components/approval/approval-feedback-thread.tsx`, `lib/approval/storage.ts`
10. Implement Approval Status Indicators  
    - `components/approval/approval-status-badge.tsx`, `components/review/review-status-badge.tsx`, `components/content-library/content-library-card.tsx`, `components/editing/content-editor-shell.tsx`
11. Integrate Approval Workflow with Editing System  
    - `lib/editing/storage.ts`, `components/editing/content-editor-shell.tsx`, `lib/approval/workflow.ts`
12. Integrate Approval Workflow with Publishing Pipeline  
    - `app/api/publish/route.ts`, `app/api/publish/update/route.ts`, `lib/approval/workflow.ts`
13. Implement Notifications for Approval Events  
    - `lib/approval/notifications.ts`, `lib/approval/workflow.ts`
14. Implement Audit Logging for Approval Actions  
    - `lib/approval/audit.ts`, `lib/approval/storage.ts`, `supabase/migrations/20260507031000_ai_content_approval_feedback_audit.sql`
15. Implement Access Control Enforcement  
    - `app/(app)/approval/page.tsx`, `app/(app)/approval/[contentId]/page.tsx`, `app/api/approval/**`, `lib/approval/permissions.ts`
16. Implement Loading and Transitional States  
    - `components/approval/approval-shell.tsx`, `components/approval/approval-action-bar.tsx`, `components/approval/approval-comment-panel.tsx`
17. Implement Error Handling for Approval Actions  
    - `app/api/approval/**`, `components/approval/approval-shell.tsx`, `components/approval/approval-action-bar.tsx`, `components/approval/approval-comment-panel.tsx`
18. Implement Multi-Step or Multi-Level Approval optional/future-ready  
    - `lib/approval/model.ts`, `components/approval/approval-action-bar.tsx`, `docs/approval/content-approval-workflow.md`
19. Test Approval Workflow Across Scenarios  
    - `lib/approval/scenarios.ts`, `docs/approval/content-approval-workflow-tests.md`
20. Optimize Performance of Approval Workflow  
    - `lib/approval/model.ts`, `lib/approval/workflow.ts`, `lib/content/library/model.ts`
21. Document Content Approval Workflow System  
    - `docs/approval/content-approval-workflow.md`, `docs/approval/content-approval-workflow-tests.md`
