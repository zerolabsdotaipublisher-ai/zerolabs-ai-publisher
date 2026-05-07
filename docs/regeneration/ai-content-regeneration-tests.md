# AI Content Regeneration Test Scenarios (MVP)

## Functional scenarios

1. Open regeneration controls from:
   - review detail
   - editing interface
   - content library card action
2. Verify owner-only access and 404/unauthorized behavior for unknown/unowned content.
3. Generate preview with `full` level for each content type.
4. Generate preview with `section` level and verify only selected section changes.
5. Generate preview with `field` level (`headline/title/summary/caption/cta`) where applicable.
6. Run each mode (`rewrite`, `improve`, `expand`, `shorten`, `simplify`, `adjust_tone`) and confirm request validation and behavior.
7. Verify regenerated result is previewed and compared before apply.
8. Verify apply saves as draft and does not auto-publish.
9. Verify applied regeneration re-enters review state based on existing editing workflow rules.
10. Verify approval workflow is still required after applying regenerated content.
11. Verify `ai_regenerate` revision entries exist after successful apply.
12. Verify validation errors block invalid regenerated draft apply.
13. Verify loading, retry, and error states in regeneration controls.
14. Verify observability events are emitted for started/succeeded/failed/applied.

## Constraint checks

- Confirm no regeneration logic was added under `services/zeroflow`.
- Confirm no raw `process.env` usage was added outside `config/env.ts` or `config/services.ts`.

## Validation commands

- `npm run lint`
- `npm run build`

