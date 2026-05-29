# Content Revision History Test Scenarios

## Scenario matrix

1. Creation baseline revision exists for each content type.
2. Manual edit save records `manual_save` revision and increments sequential version.
3. Autosave creates `autosave_checkpoint` only when checkpoint interval and meaningful diff are satisfied.
4. Regeneration routes/workflows record `ai_regenerate` revisions.
5. Approval actions create corresponding approval revisions and audit entries.
6. Publish/update flow records revision snapshots for structure-linked content.
7. Compare endpoint returns summary diff for two selected revisions.
8. Restore requires confirmation, restores content via editing workflow, and records new `restore` revision.
9. Ownership enforcement blocks cross-user list/detail/compare/restore access.
10. Pagination and indexes keep revision list bounded and performant.

## Validation checklist

- Run `npm run lint`
- Run `npm run build`
- Verify no revision logic was added under `services/zeroflow`
- Verify no raw `process.env` was introduced outside config layer
