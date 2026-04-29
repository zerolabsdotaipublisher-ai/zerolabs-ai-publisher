# Social Media Scheduling Test Scenarios (ZLAP-STORY 7-4)

## Core scheduling scenarios

1. Create one-time schedule for a generated social post with Instagram target only.
2. Create one-time schedule with multiple targets (Instagram + future-ready platforms).
3. Create draft schedule and later update to scheduled.
4. Update existing schedule timezone and confirm UTC `scheduled_for` recalculation.
5. Cancel a scheduled job and confirm status transitions to `canceled`.
6. Manual run for owner executes schedule and records run/event entries.

## Recurrence and timezone scenarios

7. Weekly recurring schedule with weekday selection yields next run in UTC.
8. Monthly recurring schedule respects wall-clock local time across DST shifts.
9. `maxOccurrences` stops future scheduling after configured completion count.

## Execution and pipeline integration scenarios

10. Due schedule claim transitions schedule from `scheduled` to `queued` (skip locked semantics).
11. Execution invokes Instagram publish workflow through existing adapter path.
12. Successful publish transitions schedule lifecycle to `published` or re-`scheduled` for recurrence.
13. Non-Instagram targets produce attention-required events while preserving future-ready model.

## Reliability and guardrail scenarios

14. Throttle guard (`maxInFlightInstagramJobsPerUser`) sets retry path instead of immediate failure.
15. Retryable failure transitions to `retry_pending` with bounded backoff.
16. Retry exhaustion transitions to `failed`.
17. Unauthorized users cannot list/update/run/cancel schedules.
18. Notification events are persisted for `published`, `failed`, and attention-required outcomes.

## Regression checks

19. `/api/schedules/execute` processes content schedules, social schedules, and Instagram jobs together.
20. No social scheduling logic exists under `services/zeroflow`.
21. No new raw `process.env` references were introduced outside `config/env.ts` and `config/services.ts`.
