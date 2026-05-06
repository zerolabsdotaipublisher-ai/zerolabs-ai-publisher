# Publishing Activity Overview Test Scenarios (ZLAP-STORY 8-6)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Authenticated user opens `/activity` and sees publishing activity overview sections.
2. API `GET /api/activity/publishing` returns owner-scoped aggregated activity.
3. Non-authenticated request to `GET /api/activity/publishing` returns 401.
4. Recent section displays latest activity items with status/event/type/platform/timestamps.
5. Upcoming section displays scheduled future items from scheduling systems.
6. Attention section displays failed and retry-pending items.
7. Status indicators render: published, scheduled, failed, publishing, retry_pending, canceled.
8. Filters apply by platform.
9. Filters apply by status.
10. Filters apply by content type.
11. Date range filters constrain activity by occurred timestamp.
12. Segment filter switches between all/recent/upcoming/attention behavior.
13. Timeline grouping renders chronological day groups.
14. Retry quick action triggers existing retry/run APIs and overview refreshes.
15. Edit/preview/open quick actions route to existing flows when structure linkage exists.
16. Loading state renders skeleton cards while fetching.
17. Empty state renders contextual copy when no items match.
18. API/quick-action failures render retryable error state.
19. Dashboard quick actions include Publishing activity link.
20. Dashboard recent activity includes link to full activity overview.
21. App navigation includes Activity entry.
22. No publishing-activity logic exists under `services/zeroflow`.
23. No raw `process.env` usage is introduced outside `config/env.ts` and `config/services.ts`.
24. MVP remains operational overview only (no analytics/reporting platform duplication).
