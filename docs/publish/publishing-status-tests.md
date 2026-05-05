# Publishing Status Test Scenarios (ZLAP-STORY 8-3)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Draft website displays `Draft` badge in listing, dashboard, editor/preview controls, and generated-site status summary.
2. Active publish operation displays `Publishing` (or `Updating` backend mode) and publish action stays disabled.
3. Published website with no pending changes displays `Live` and shows `last published` timestamp.
4. Published website with saved draft deltas displays `Updates pending` and action label changes to `Publish updates`.
5. Failed publish/update displays `Failed` and failure message from status metadata.
6. Archived website displays `Archived` and publish action is blocked.
7. Deleted website displays `Deleted` and publish action is blocked.
8. Listing page status data refreshes via lightweight polling without per-card status API requests.
9. Dashboard summary refreshes via lightweight polling and reflects latest status counts/list.
10. Publish controls poll `/api/publish/status` and refresh status/timestamps while user stays on page.
11. Non-authenticated request to `/api/publish/status` returns 401.
12. Non-owned structure request to `/api/publish/status` returns not found for owner protection.
13. `last updated` and `last published` timestamps render consistently in status summary surfaces.
14. Status filters on website listing accept unified states (`draft`, `publishing`, `updating`, `live`, `unpublished_changes`, `failed`, `archived`, `deleted`).
15. No publishing status logic is introduced under `services/zeroflow`.
16. No raw `process.env` access is introduced outside `config/env.ts` and `config/services.ts`.
17. Existing publish/deployment/versioning workflow remains reused (no duplicate lifecycle system).
18. MVP boundaries remain limited to status display, status retrieval, and status-based UI behavior.
