# Social Media Publishing History (ZLAP-STORY 7-5)

This story adds AI Publisher-owned social publishing history for audit, debugging, retries, and analytics foundations.

## Architecture alignment

- History is implemented in AI Publisher (`lib/social/history/*`).
- No logic is added under `services/zeroflow`.
- Existing social generation, publishing, and scheduling workflows are reused.
- No second scheduler/pipeline is introduced.
- No raw `process.env` usage is introduced outside config modules.

## Data model

Core entities:

- `SocialPublishHistoryJob` (one publish job timeline)
- `SocialPublishHistoryDelivery` (one row per platform delivery)
- `SocialPublishHistoryEvent` (immutable audit trail)

Lifecycle tracked:

- `requested -> queued -> publishing -> published | failed -> retry -> canceled`

Stored data:

- content snapshot (`caption`, `media`, metadata)
- platform/account reference
- provider request + response payloads
- error details
- timestamps (`scheduled`, `started`, `completed`, `retry`)
- ownership (`user_id`, optional `tenant_id`)

## MVP boundaries

### In scope

- Instagram delivery tracking (future-ready model supports other platforms).
- Owner-scoped retrieval APIs with filtering + pagination.
- Manual retry from history endpoint.
- Audit events and delivery records persisted for each transition.

### Out of scope

- Analytics dashboards.
- External reporting APIs.
- Automatic replay orchestration beyond current retry flow.

## Task-to-file mapping (all 20 tasks)

1. Define publishing history requirements  
   - `lib/social/history/schema.ts`, `docs/social/social-media-history.md`
2. Define publishing history data model  
   - `lib/social/history/types.ts`, `supabase/migrations/social_publishing_history.sql`
3. Design database schema  
   - `supabase/migrations/social_publishing_history.sql`
4. Implement persistence layer  
   - `lib/social/history/storage.ts`
5. Capture initial publish request  
   - `app/api/social/instagram/publish/route.ts`, `lib/social/history/workflow.ts`
6. Capture platform delivery records  
   - `lib/social/history/workflow.ts`, `lib/social/history/storage.ts`
7. Capture publish status updates  
   - `lib/social/instagram/publish.ts`, `lib/social/history/workflow.ts`
8. Store error and failure details  
   - `lib/social/instagram/publish.ts`, `lib/social/history/workflow.ts`
9. Store content snapshot  
   - `lib/social/history/workflow.ts`
10. Implement timestamp tracking  
   - `lib/social/history/types.ts`, `lib/social/history/workflow.ts`, migration
11. Ownership mapping  
   - migration ownership columns + RLS policies, `lib/social/history/storage.ts`
12. Access control  
   - `app/api/social/history/*.ts`, migration RLS policies
13. Retrieval APIs  
   - `app/api/social/history/route.ts`, `app/api/social/history/[id]/route.ts`
14. Filtering and search  
   - `lib/social/history/validation.ts`, `lib/social/history/storage.ts`, list API route
15. UI integration  
   - `components/social/social-history-panel.tsx`, `components/social/social-history-list.tsx`, `components/social/social-schedule-panel.tsx`, `app/(app)/generated-sites/[id]/page.tsx`, `app/globals.css`
16. Retry from history  
   - `app/api/social/history/[id]/retry/route.ts`, `lib/social/history/workflow.ts`
17. Audit logging  
   - `lib/social/history/storage.ts`, `lib/social/history/workflow.ts`
18. DB indexing/performance  
   - migration indexes in `social_publishing_history.sql`
19. Scenario testing  
   - `lib/social/history/scenarios.ts`, `docs/social/social-media-history-tests.md`
20. Documentation  
   - `docs/social/social-media-history.md`, `docs/social/social-media-history-tests.md`
