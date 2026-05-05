# Dashboard Homepage (ZLAP-STORY 8-1)

This story implements the AI Publisher dashboard homepage MVP.

## Architecture alignment

- Dashboard homepage is implemented inside AI Publisher app routes and libs.
- No dashboard logic is introduced under `services/zeroflow`.
- Existing website management, content storage, scheduling, social history, and social account systems are reused.
- No raw `process.env` usage is introduced outside config modules.

## Homepage IA and UI layout

Dashboard homepage includes:

- Overview metrics
- Quick actions panel
- Notifications and alerts
- Website summary
- Content summary
- Social media activity summary
- Recent activity feed

Layout behavior:

- Desktop: multi-column summary panels and metrics grid
- Tablet/mobile: stacked cards and single-column sections

## Data aggregation and API

- Route: `GET /api/dashboard/summary`
- Ownership/access control: authenticated user required, summary scoped by `user.id`
- Aggregation layer: `lib/dashboard/model.ts` and `lib/dashboard/storage.ts`
- Existing data sources reused:
  - website management listing
  - generated content storage (`website_generated_content`)
  - content schedules via management summaries
  - social schedules
  - social posts
  - social publish history
  - social account connections

## Alerts and activity

Alerts cover:

- failed website publish/update
- failed social publish history jobs
- failed/retry-pending schedules
- expired/invalid/reauth-required social accounts
- missing social account connections

Recent activity covers:

- content generation updates
- website updates
- website/social publish events
- social scheduling changes
- social account status events

## Access control and personalization

- Dashboard route remains under authenticated app shell.
- API route validates server user before returning data.
- Dashboard greeting uses available display name from user metadata.

## Analytics hooks

Lightweight tracking is added through existing `/api/observability/events` pattern for:

- dashboard quick actions
- dashboard refresh action

No new analytics infrastructure is introduced.

## MVP boundaries

- This is a homepage summary, not a full analytics/reporting platform.
- No duplicate management, scheduling, or publishing systems are created.
- Quick actions link into existing workflows.
- Social account connect quick action targets current MVP flow.
- Alerts are in-app only (no external notification delivery).

## Task-to-file mapping (all 20 tasks)

1. Define Dashboard Homepage Requirements  
   - `docs/dashboard/dashboard-homepage.md`, `lib/dashboard/schema.ts`
2. Define Dashboard Information Architecture  
   - `docs/dashboard/dashboard-homepage.md`, `components/dashboard/dashboard-home.tsx`
3. Design Dashboard UI and Layout  
   - `components/dashboard/dashboard-home.tsx`, `app/globals.css`
4. Implement Dashboard Base Layout  
   - `app/(app)/dashboard/page.tsx`, `components/dashboard/dashboard-home.tsx`
5. Implement Overview Metrics Section  
   - `lib/dashboard/metrics.ts`, `components/dashboard/dashboard-metric-card.tsx`, `components/dashboard/dashboard-home.tsx`
6. Implement Recent Activity Feed  
   - `lib/dashboard/activity.ts`, `components/dashboard/dashboard-recent-activity.tsx`
7. Implement Quick Actions Panel  
   - `lib/dashboard/schema.ts`, `components/dashboard/dashboard-quick-actions.tsx`
8. Implement Website Summary Section  
   - `lib/dashboard/model.ts`, `components/dashboard/dashboard-website-summary.tsx`
9. Implement Content Summary Section  
   - `lib/dashboard/storage.ts`, `lib/dashboard/model.ts`, `components/dashboard/dashboard-content-summary.tsx`
10. Implement Social Media Activity Section  
    - `lib/dashboard/storage.ts`, `lib/dashboard/model.ts`, `components/dashboard/dashboard-social-summary.tsx`
11. Implement Notifications and Alerts Section  
    - `lib/dashboard/alerts.ts`, `components/dashboard/dashboard-alerts.tsx`
12. Implement Data Fetching and API Integration  
    - `app/api/dashboard/summary/route.ts`, `components/dashboard/dashboard-home.tsx`, `lib/dashboard/model.ts`
13. Implement Loading and Empty States  
    - `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-recent-activity.tsx`
14. Implement Error Handling for Dashboard Data  
    - `app/api/dashboard/summary/route.ts`, `lib/dashboard/model.ts`, `components/dashboard/dashboard-home.tsx`
15. Implement Responsive Behavior  
    - `app/globals.css`
16. Implement Access Control and Personalization  
    - `app/(app)/dashboard/page.tsx`, `app/api/dashboard/summary/route.ts`, `components/dashboard/dashboard-home.tsx`
17. Implement Analytics and Event Tracking  
    - `components/dashboard/dashboard-home.tsx`, `components/dashboard/dashboard-quick-actions.tsx`, `app/api/observability/events/route.ts`
18. Optimize Dashboard Performance  
    - `lib/dashboard/storage.ts`, `lib/dashboard/model.ts`, `app/(app)/dashboard/page.tsx`
19. Test Dashboard Homepage Across Scenarios  
    - `docs/dashboard/dashboard-homepage-tests.md`
20. Document Dashboard Homepage Implementation  
    - `docs/dashboard/dashboard-homepage.md`, `docs/dashboard/dashboard-homepage-tests.md`
