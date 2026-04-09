# Website Creation Wizard Scenario Tests

## Scenario matrix

| Scenario | Inputs | Expected behavior |
| --- | --- | --- |
| Business full-input path | Required fields + founder/testimonials/contact/constraints | All steps complete, review shows full summary, generation succeeds and opens `/generated-sites/{id}` |
| Portfolio low-input path | Required fields only, skip content-input | Skip works without blocking, validation still enforces required fields, generation succeeds |
| Personal brand backtracking | Fill steps, go back from review, edit brand and style, regenerate | Previous values persist, edits are reflected in review and output |
| Optional field validation | Add malformed testimonial (`quote` without `author`) | Step-level validation blocks progression with friendly error |
| Mobile flow | Run full flow on narrow viewport | Stepper wraps, fields stack, nav actions remain accessible and usable |
| Generation API failure | Simulate failed generation route response | Wizard returns to review with actionable generation error and retry path |

## Manual test checklist

- [ ] Can start wizard from Dashboard CTA and app header link
- [ ] Progress bar and step indicator update correctly for each step
- [ ] Required fields block next when empty
- [ ] Optional content step can be skipped
- [ ] Review step supports editing previous steps
- [ ] Back button preserves previously entered values
- [ ] Loading step surfaces staged status text
- [ ] Success step links to generated output page
- [ ] Create-another reset clears state and restarts at first step
- [ ] Mobile layout remains readable and tappable

## Integration assertions

- [ ] Wizard maps typed state to `WebsiteGenerationInput`
- [ ] Wizard calls existing `POST /api/ai/generate-structure`
- [ ] Wizard calls existing `POST /api/ai/generate-content` with `structureId`
- [ ] No duplicate or parallel website generation pipeline introduced
- [ ] No raw `process.env` usage introduced by wizard changes
