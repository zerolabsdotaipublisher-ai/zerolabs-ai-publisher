# Content Library Test Scenarios (ZLAP-STORY 8-5)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Functional scenarios

1. Authenticated user opens `/content` and sees generated content library shell.
2. API `GET /api/content/library` returns 401 for unauthenticated callers.
3. Only user-owned generated content appears in library items.
4. Library includes websites/pages, blog posts, articles, and social posts.
5. Type filter narrows to each content type.
6. Status filter narrows by lifecycle state.
7. Linked website filter narrows to a specific owned website.
8. Search matches title and metadata keyword/campaign fields.
9. Default sorting is recently updated.
10. Sort by created date works.
11. Sort alphabetical by title works.
12. Status badge appears on each card.
13. Quick actions show view/edit/publish-schedule links only when routes exist.
14. Delete quick action is shown only when existing safe delete flow applies.
15. Deleting supported item calls existing `/api/content` delete flow and refreshes listing.
16. Empty state appears with and without active filters.
17. Loading skeleton appears while fetching.
18. Error state shows retry action when API request fails.
19. Incremental loading appends next page when `Load more` is used.
20. Responsive behavior stacks controls/cards on mobile viewport.
21. Dashboard quick action and content summary link to `/content`.
22. No content-library logic is added under `services/zeroflow`.
23. No raw `process.env` is introduced outside config layer.
