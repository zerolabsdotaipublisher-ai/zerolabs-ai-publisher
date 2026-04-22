# AI Content Scheduling

This document covers the AI content scheduling system added for `ZLAP-STORY 6-5`.

## Goals

- Keep scheduling product-owned inside AI Publisher.
- Reuse existing blog/article generation, draft save, versioning, publish, and deployment flows.
- Support one-time and recurring schedules with timezone-aware execution.
- Provide MVP-safe retries, run logs, and queue claiming without creating a second orchestration platform.

## Architecture Boundary

- Layer 1 AI Publisher owns:
  - schedule records
  - recurrence rules
  - execution lifecycle and run history
  - schedule management UI
  - generation-before-publish logic
  - publish/deploy integration
- Layer 2 ZeroFlow does not own:
  - schedule metadata
  - recurrence state
  - schedule queues
  - app-specific content scheduling workflows

## Data Model

Supabase stores scheduling data in two product-owned tables:

- `public.content_schedules`
  - one schedule record per `website_structures.id`
  - execution mode, timezone, recurrence, retry policy, lifecycle state, and next due timestamp
- `public.content_schedule_runs`
  - per-run execution history
  - run status, trigger source, publish action, retry metadata, logs, and timing metrics

The scheduler also keeps `scheduled_publish_at` and `published_at` in sync for blog/article rows so scheduled content remains compatible with existing content views and storage.

## Execution Flow

1. An authenticated user creates or updates a schedule through `/api/schedules`.
2. The scheduler computes the next UTC execution time from the stored local wall-clock rule and timezone.
3. A token-guarded system call hits `/api/schedules/execute`.
4. The scheduler claims due work through `claim_due_content_schedules(...)`.
5. Each claimed schedule runs in AI Publisher:
   - optionally regenerate blog/article content
   - persist the refreshed draft through the existing editor/versioning path
   - publish or update through `lib/publish/workflow.ts`
6. The scheduler stores run logs, updates retry state, and computes the next occurrence.

## APIs

- `GET /api/schedules?structureId=...`
  - load the schedule and recent runs for a website
- `POST /api/schedules`
  - create or update the schedule for a website
- `POST /api/schedules/[scheduleId]/pause`
  - pause further execution
- `POST /api/schedules/[scheduleId]/resume`
  - resume and recompute the next run
- `POST /api/schedules/[scheduleId]/run`
  - run the schedule immediately through the same execution engine
- `DELETE /api/schedules/[scheduleId]`
  - cancel the schedule
- `POST /api/schedules/execute`
  - token-guarded batch execution endpoint for cron/system calls

## Configuration

Optional environment variables:

- `CRON_SECRET`
- `SCHEDULER_EXECUTION_TOKEN`
- `SCHEDULER_BATCH_SIZE`

`CRON_SECRET` or `SCHEDULER_EXECUTION_TOKEN` is used as the bearer token for `/api/schedules/execute`. `SCHEDULER_BATCH_SIZE` caps the number of due schedules claimed in one execution batch.

## Monitoring

The scheduler emits structured logs through `lib/observability/logger.ts` and records in-process execution duration metrics through `lib/observability/metrics.ts`.

Operational signals to watch:

- repeated `failed` or `retry_scheduled` runs
- stale schedules with overdue `next_run_at`
- repeated generation-before-publish failures for the same structure
- batch executions that claim work but process fewer schedules than expected

## MVP Boundaries

- One schedule record is supported per website structure.
- `generate_then_publish` is supported only for blog and article websites.
- Due schedules are processed sequentially inside a batch request.
- Retry recovery is bounded by schedule policy; after retry exhaustion the schedule moves to `failed` and requires an operator action.
- The scheduler exposes a batch execution endpoint but does not introduce a separate enterprise-grade orchestration service, distributed worker fleet, or ZeroFlow-owned scheduling subsystem.
