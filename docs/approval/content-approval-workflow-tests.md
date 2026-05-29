# Content Approval Workflow Test Scenarios (ZLAP-STORY 9-3)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Authenticated user opens `/approval` and sees owner-scoped approval queue.
2. `GET /api/approval` returns 401 for unauthenticated requests.
3. Queue includes website pages, blog posts, articles, and social posts.
4. Items without decision records resolve to `draft`.
5. Submit-for-approval moves eligible content to `pending_approval`.
6. Approve action moves content to `approved`.
7. Reject action moves content to `rejected`.
8. Request changes action moves content to `needs_changes`.
9. Editing rejected/needs_changes content still allows resubmission (`submit`).
10. `POST /api/approval/[contentId]/comment` persists lightweight feedback comments.
11. Approval actions append audit entries.
12. Approval notifications hooks fire for submitted/approved/rejected/changes requested events.
13. `/approval/[contentId]` shows action controls, comments, and feedback thread.
14. Review page status indicators reflect approval naming (`pending approval`).
15. Content library cards display approval status indicators.
16. Editor panel shows approval status indicator.
17. Dashboard quick action links to approval queue.
18. `POST /api/publish` blocks structures with unapproved linked content.
19. `POST /api/publish/update` blocks structures with unapproved linked content.
20. Approval endpoints enforce server-side ownership and do not expose cross-user data.
21. Loading/error/transitional states show for queue/actions/comment submissions.
22. Multi-level approval remains future-ready documentation only.
23. No approval logic is added under `services/zeroflow`.
24. No raw `process.env` is introduced outside config/env.ts or config/services.ts.
