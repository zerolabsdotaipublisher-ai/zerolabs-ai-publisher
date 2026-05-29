# Social Media Publishing History Test Scenarios (ZLAP-STORY 7-5)

## Validation commands

1. `npm run lint`
2. `npm run build` (with required env values set)

## Core history scenarios

1. Manual Instagram publish writes initial `requested` history row before execution.
2. Scheduled social execution writes history row linked to `social_schedule` source.
3. Publish execution transitions history state to `queued` before provider call.
4. Provider call starts and transitions history to `publishing` with request payload.
5. Successful provider response transitions history to `published` with response payload.
6. Failed provider response records error metadata and transitions to `failed`.
7. Retryable failure transitions to `retry` with `retry_at` timestamp.
8. Retry execution from `/api/social/history/[id]/retry` re-runs linked publish job.

## Retrieval and access scenarios

9. Owner can list history with pagination.
10. Owner filters by status.
11. Owner filters by platform.
12. Owner filters by account reference id.
13. Owner filters by date range.
14. Owner can fetch history detail with delivery + event timeline.
15. Non-owner cannot list/detail/retry another user history.

## Data integrity scenarios

16. Content snapshot persists caption/media/metadata even when post later changes.
17. Per-platform delivery row exists for each tracked job.
18. Event trail is appended for every lifecycle transition.
19. History records include ownership fields (`user_id`, optional `tenant_id`).
20. Retry linkage remains on same history job via `publish_job_id`.

## Regression checks

21. No social history logic exists under `services/zeroflow`.
22. No raw `process.env` usage was added outside `config/env.ts` and `config/services.ts`.
23. Existing scheduler endpoint `/api/schedules/execute` remains the single pipeline entrypoint.
