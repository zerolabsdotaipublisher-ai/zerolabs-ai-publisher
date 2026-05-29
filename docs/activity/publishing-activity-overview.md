# Publishing Activity Overview (ZLAP-STORY 8-6)

This story implements a publishing activity overview MVP in AI Publisher.

## Architecture alignment

- Publishing activity overview logic is implemented inside AI Publisher app routes/components/libs.
- No publishing activity logic is introduced under `services/zeroflow`.
- Existing website publishing, content scheduling, social scheduling, social history, dashboard, and ownership systems are reused.
- No raw `process.env` usage is introduced outside config modules.
- No duplicate analytics/event platform is introduced.

## Activity overview scope

Route: `/activity`

The overview aggregates activity from:

- website publishing lifecycle
- generated content publishing/scheduling state
- website content scheduling
- social scheduling
- social publishing history

Displayed fields include:

- content title
- content type
- platform
- account (if available)
- status
- event type
- timestamps (occurred and scheduled)

Supported statuses:

- published
- scheduled
- failed
- publishing
- retry_pending
- canceled

## Data model summary

`lib/activity/types.ts` defines:

- normalized activity item shape
- operational status/event/platform/content unions
- segment/filter query model
- timeline grouping model
- server storage snapshot shape

## UI layout

Publishing activity UI includes:

- overview header + metadata
- filter bar (platform/status/content type/segment/date range)
- recent activity section
- upcoming scheduled section
- failed/attention-required section
- optional timeline grouping section (MVP-safe)
- quick actions routed into existing flows

Responsive behavior stacks filters/sections/items on narrow viewports.

## Data fetching and ownership

- API route: `GET /api/activity/publishing`
- Authenticated server user required
- Aggregation scoped by `user.id`
- Server-side aggregation/reduction in `lib/activity/storage.ts` + `lib/activity/model.ts`
- Query parsing and normalization in `lib/activity/schema.ts`

## Filters and segmentation

Supported filters:

- platform
- status
- content type
- date range (`from`, `to`)
- segment (`all`, `recent`, `upcoming`, `attention`)

## Timeline (optional MVP-safe)

- Chronological grouping by day is provided in `lib/activity/timeline.ts`
- UI renders grouped items in `components/activity/activity-timeline.tsx`

## Quick actions

Quick actions only reuse existing flows:

- retry failed social history (`POST /api/social/history/[id]/retry`)
- retry failed schedule runs (`POST /api/schedules/[scheduleId]/run`, `POST /api/social/schedules/[scheduleId]/run`)
- edit / preview / open content routes when structure linkage exists

## Dashboard and navigation integration

- App nav includes `/activity`
- Dashboard quick actions include Publishing activity
- Dashboard recent activity panel links to full activity overview

## MVP boundaries

- Operational overview only; not a full analytics/reporting product.
- Aggregation is query-bounded and owner-scoped.
- Existing publish/schedule/history systems are reused.
- No duplicate pipelines or event infrastructure are introduced.

## Task-to-file mapping (all 20 tasks)

1. Define Publishing Activity Overview Requirements  
   - `docs/activity/publishing-activity-overview.md`, `lib/activity/scenarios.ts`
2. Define Publishing Activity Data Model  
   - `lib/activity/types.ts`, `lib/activity/schema.ts`
3. Design Publishing Activity UI Layout  
   - `components/activity/activity-overview-shell.tsx`, `components/activity/activity-item.tsx`, `app/globals.css`
4. Implement Activity Overview Section Shell  
   - `app/(app)/activity/page.tsx`, `components/activity/activity-overview-shell.tsx`
5. Implement Activity Item Component  
   - `components/activity/activity-item.tsx`
6. Implement Data Fetching for Activity Overview  
   - `app/api/activity/publishing/route.ts`, `lib/activity/model.ts`, `lib/activity/storage.ts`
7. Display Recent Publishing Activity  
   - `components/activity/activity-overview-shell.tsx`, `lib/activity/model.ts`
8. Implement Status Indicators for Activity  
   - `components/activity/activity-item.tsx`, `app/globals.css`, `lib/activity/types.ts`
9. Implement Activity Filtering and Segmentation  
   - `components/activity/activity-filters.tsx`, `lib/activity/filters.ts`, `lib/activity/schema.ts`, `lib/activity/model.ts`
10. Implement Timeline or Chronological View (Optional MVP-safe)  
    - `lib/activity/timeline.ts`, `components/activity/activity-timeline.tsx`
11. Display Scheduled and Upcoming Activity  
    - `components/activity/activity-overview-shell.tsx`, `lib/activity/model.ts`
12. Display Failed and Attention-Required Activity  
    - `components/activity/activity-overview-shell.tsx`, `lib/activity/model.ts`
13. Implement Quick Actions from Activity Overview  
    - `components/activity/activity-item.tsx`, `components/activity/activity-overview-shell.tsx`, `lib/activity/model.ts`
14. Implement Loading and Empty States  
    - `components/activity/activity-loading.tsx`, `components/activity/activity-empty-state.tsx`, `components/activity/activity-overview-shell.tsx`
15. Implement Error Handling for Activity Data  
    - `app/api/activity/publishing/route.ts`, `components/activity/activity-overview-shell.tsx`
16. Implement Access Control and Personalization  
    - `app/(app)/activity/page.tsx`, `app/api/activity/publishing/route.ts`, `lib/activity/storage.ts`
17. Optimize Performance for Activity Overview  
    - `lib/activity/storage.ts`, `lib/activity/model.ts`
18. Integrate Activity Overview with Dashboard  
    - `config/routes.ts`, `app/(app)/layout.tsx`, `lib/dashboard/schema.ts`, `components/dashboard/dashboard-recent-activity.tsx`
19. Test Publishing Activity Overview Across Scenarios  
    - `docs/activity/publishing-activity-overview-tests.md`, `lib/activity/scenarios.ts`
20. Document Publishing Activity Overview Feature  
    - `docs/activity/publishing-activity-overview.md`, `docs/activity/publishing-activity-overview-tests.md`
