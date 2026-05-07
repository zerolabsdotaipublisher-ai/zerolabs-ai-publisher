# AI Generated Content Editing Tests (MVP)

## Functional Scenarios

1. Open `/edit/[contentId]` for each supported content type.
2. Verify owner-only access and 404 for unknown/unowned content.
3. Edit title/summary/body and save manually.
4. Edit section blocks and save.
5. Edit media references and save.
6. Edit metadata/SEO fields and save.
7. Confirm autosave executes after debounce while typing.
8. Confirm validation errors for missing required fields.
9. Confirm successful save updates `updatedAt` and version metadata.
10. Confirm edited approved/published content returns to `pending_review`.
11. Confirm edited rejected/needs_changes remains `needs_changes`.
12. Confirm preview panel behavior for website/blog/article vs social.
13. Confirm responsive layout and unsaved-change warning behavior.

## Integration Checks

- Content library Edit links route to `/edit/[contentId]`.
- Review list/detail Edit links route to `/edit/[contentId]`.
- Existing publish/update flow still required for live updates.

## Validation Commands

- `npm run lint`
- `npm run build`
