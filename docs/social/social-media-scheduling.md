# Social Media Scheduling System (ZLAP-STORY 7-4)

This story implements AI Publisher-owned social scheduling for generated social posts with Instagram-first delivery and future-ready multi-platform targets.

## Architecture alignment

- Social scheduling logic is implemented in AI Publisher under `lib/social/scheduling/*`.
- `services/zeroflow` is unchanged and still contains shared services only.
- Existing scheduling and publish execution path is reused through `/api/schedules/execute`.
- Existing Story 7-2 social posts and Story 7-3 Instagram publish workflow are reused.
- No raw `process.env` usage was introduced outside config layer modules.

## MVP boundaries

### In scope

- Owner-scoped social schedule CRUD, cancel, and manual run APIs.
- One-time scheduling as primary MVP behavior.
- Optional recurring support using existing recurrence/timezone mechanics.
- UTC execution storage with timezone-aware local input.
- Multi-platform target model (`instagram`, `facebook`, `linkedin`, `x`) with Instagram-first real adapter.
- Queue claiming with DB locking (`claim_due_social_schedules`) and bounded execution concurrency guardrails.
- Bounded retries with exponential backoff and `retry_pending` lifecycle.
- Schedule/run/event tracking with notification event records.
- Scheduler integration in `/api/schedules/execute` and dedicated `/api/social/schedules/execute`.
- UI integration for create/view/edit/cancel/run schedule.

### Out of scope for this MVP

- Live publishing adapters for Facebook, LinkedIn, and X.
- Approval workflows, team-level assignments, and advanced campaign orchestration.
- Dedicated worker fleet outside existing scheduler execution endpoints.

## Scheduling lifecycle and status model

Primary schedule lifecycle states:

- `draft`
- `scheduled`
- `queued`
- `publishing`
- `published`
- `failed`
- `canceled`
- `retry_pending`

Run lifecycle states:

- `queued`
- `publishing`
- `published`
- `failed`
- `retry_pending`
- `canceled`

## Task-to-file mapping (all 21 tasks)

1. Define Social Media Scheduling Requirements  
   - `docs/social/social-media-scheduling.md`, `lib/social/scheduling/schema.ts`
2. Define Social Scheduling Data Model  
   - `lib/social/scheduling/types.ts`, `supabase/migrations/20260429030000_social_scheduling.sql`
3. Define Scheduling Lifecycle and Status Model  
   - `lib/social/scheduling/types.ts`, `lib/social/scheduling/schema.ts`
4. Implement Scheduling Creation Logic  
   - `lib/social/scheduling/storage.ts`, `lib/social/scheduling/validation.ts`, `app/api/social/schedules/route.ts`
5. Implement Scheduling Update and Cancellation  
   - `lib/social/scheduling/storage.ts`, `app/api/social/schedules/[scheduleId]/route.ts`, `app/api/social/schedules/[scheduleId]/cancel/route.ts`
6. Implement Scheduling Execution Engine  
   - `lib/social/scheduling/workflow.ts`, `app/api/social/schedules/[scheduleId]/run/route.ts`, `app/api/social/schedules/execute/route.ts`
7. Implement Timezone Handling for Scheduling  
   - `lib/social/scheduling/timezone.ts`, `lib/social/scheduling/recurrence.ts`, `lib/social/scheduling/validation.ts`
8. Implement Multi-Platform Scheduling Support  
   - `lib/social/scheduling/types.ts`, `lib/social/scheduling/validation.ts`, `lib/social/scheduling/workflow.ts`
9. Integrate Scheduling with Social Publishing Pipeline  
   - `lib/social/scheduling/workflow.ts`, `app/api/schedules/execute/route.ts`
10. Integrate Scheduling with AI Content Generation  
    - `lib/social/scheduling/storage.ts`, `lib/social/scheduling/validation.ts`
11. Implement Scheduling Queue and Concurrency Handling  
    - `lib/social/scheduling/queue.ts`, `lib/social/scheduling/storage.ts`, `supabase/migrations/20260429030000_social_scheduling.sql`
12. Implement Scheduling Status Tracking  
    - `lib/social/scheduling/types.ts`, `lib/social/scheduling/storage.ts`, `lib/social/scheduling/workflow.ts`
13. Implement Error Handling and Retry Logic  
    - `lib/social/scheduling/workflow.ts`, `lib/social/scheduling/queue.ts`
14. Implement Rate Limiting and Throttling  
    - `lib/social/scheduling/queue.ts`, `lib/social/scheduling/workflow.ts`
15. Implement Access Control for Scheduling  
    - `app/api/social/schedules/*.ts`, `supabase/migrations/20260429030000_social_scheduling.sql`
16. Implement Scheduling UI Integration  
    - `components/social/social-schedule-panel.tsx`, `components/social/social-schedule-list.tsx`, `app/(app)/generated-sites/[id]/page.tsx`, `app/globals.css`
17. Implement Notifications for Scheduled Events  
    - `lib/social/scheduling/notifications.ts`, `lib/social/scheduling/storage.ts`
18. Test Social Media Scheduling Across Scenarios  
    - `lib/social/scheduling/scenarios.ts`, `docs/social/social-media-scheduling-tests.md`
19. Optimize Scheduling Performance and Scalability  
    - `lib/social/scheduling/queue.ts`, `lib/social/scheduling/workflow.ts`, `supabase/migrations/20260429030000_social_scheduling.sql`
20. Monitor Scheduling System Performance  
    - `lib/social/scheduling/workflow.ts`, `app/api/schedules/execute/route.ts`
21. Document Social Media Scheduling System  
    - `docs/social/social-media-scheduling.md`, `docs/social/social-media-scheduling-tests.md`
