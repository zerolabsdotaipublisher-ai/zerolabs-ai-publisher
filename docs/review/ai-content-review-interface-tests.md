# AI Content Review Interface Test Scenarios (ZLAP-STORY 9-1)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Authenticated user opens `/review` and sees review queue shell.
2. `GET /api/review` returns 401 for unauthenticated requests.
3. Review queue includes owner-scoped website pages, blog posts, articles, and social posts.
4. Review state defaults to `pending_review` for items without a persisted decision.
5. Published content surfaces as `published` review state.
6. Review filters by type and review state work correctly.
7. Search and sort controls affect review list results.
8. Review cards show status badge, metadata, and review links.
9. `/review/[contentId]` shows preview, metadata, and action controls.
10. Approve action sets review decision to `approved` and marks publish-ready.
11. Reject action sets review decision to `rejected` with optional feedback note.
12. Needs changes action sets review decision to `needs_changes` with feedback note.
13. Regenerate action triggers existing regeneration workflows per content type.
14. Edit action routes to existing editor flow when available.
15. Inline editing supports social post title updates and reviewer note updates.
16. `GET /api/review/[contentId]` and `PATCH /api/review/[contentId]` enforce ownership.
17. Publishing endpoints block when linked review records are `rejected` or `needs_changes`.
18. Review UI handles loading, empty, and error states.
19. Review layout remains usable on mobile viewport.
20. Version comparison/comments surfaces are present as future-ready notes.
21. No review logic is added under `services/zeroflow`.
22. No raw `process.env` is introduced outside config layer.
