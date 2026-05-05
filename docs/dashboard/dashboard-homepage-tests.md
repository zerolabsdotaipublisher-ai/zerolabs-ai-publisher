# Dashboard Homepage Test Scenarios (ZLAP-STORY 8-1)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Authenticated user opens `/dashboard` and sees homepage summary sections.
2. Dashboard metrics show totals for websites, published items, generated content, scheduled items, and attention-required items.
3. Recent activity includes entries for generation, website updates, publish events, social scheduling/publishing, and account events when available.
4. Quick actions include: create website, generate content, view websites, schedule social post, connect social account.
5. Website summary reflects owned website lifecycle data.
6. Content summary reflects generated content counts and scheduled/published totals.
7. Social summary reflects account connection state, social posts, scheduling, and failed history jobs.
8. Alerts surface failed publishes, failed schedules, account reauth/expired states, and missing account conditions.
9. Dashboard loads with skeleton state when client fetch is required.
10. Dashboard empty state appears when no websites/content/social data exists.
11. Dashboard error state appears when summary API fails and retry restores state.
12. Dashboard refresh action reloads summary from `/api/dashboard/summary`.
13. Non-authenticated API call to `/api/dashboard/summary` returns 401.
14. Dashboard data remains owner-scoped by authenticated `user.id`.
15. Quick action clicks send observability events without blocking navigation.
16. Responsive behavior stacks sections on smaller viewports.
17. No dashboard logic exists under `services/zeroflow`.
18. No raw `process.env` usage is introduced outside `config/env.ts` and `config/services.ts`.
19. Existing website/content/social systems continue to be reused (no duplicate management or analytics platform).
20. MVP boundaries remain limited to homepage summary and workflow entrypoints.
