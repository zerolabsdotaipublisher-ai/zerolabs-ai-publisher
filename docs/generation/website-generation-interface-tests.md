# Website Generation Interface Tests

## Scenario matrix

| Scenario | Expected behavior |
| --- | --- |
| Wizard handoff to generation | `/create` review opens `/generate` with prefilled inputs and no re-entry required |
| Validation failure | Missing required fields show errors and prevent API submission |
| Generation failure and retry | Failure state appears, inputs persist, retry triggers a new generation attempt |
| Success to preview | Success exposes `/generated-sites/{id}` preview link and opens preview correctly |
| Edit and regenerate | User edits inputs after success/failure and can regenerate with updated values |
| Mobile behavior | Generation layout stacks into a single-column flow with usable controls |
| Accessibility checks | Keyboard navigation works, status regions announce updates via `aria-live` |

## Manual checklist

- [ ] Complete wizard required inputs and continue to `/generate`
- [ ] Confirm all wizard inputs are present in generation interface
- [ ] Trigger validation error and verify inline alert panel
- [ ] Run generation and observe stage updates in status panel
- [ ] On success, open generated preview route
- [ ] Simulate API failure and verify retry path
- [ ] Edit one input and regenerate
- [ ] Verify mobile viewport behavior (<768px)
- [ ] Verify screen reader announcements for loading/error/success states
- [ ] Confirm event endpoint receives generation events

## Pipeline assertions

- [ ] Uses existing `POST /api/ai/generate-structure`
- [ ] Uses existing `POST /api/ai/generate-content`
- [ ] No duplicate generation backend pipeline introduced
- [ ] No raw `process.env` usage added
