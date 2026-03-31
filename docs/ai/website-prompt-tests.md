# Website Prompt Test Scenarios (Design-Time)

This story does not execute live model calls by default. Validation focuses on prompt assembly quality, schema fitness, and scenario coverage.

## Fixture scenarios

Located in `lib/ai/prompts/fixtures/`:
- `portfolio.ts`
- `business-site.ts`
- `landing-page.ts`
- `personal-brand.ts`
- `edge-cases.ts`

## What each scenario validates

1. **Portfolio**
   - Founder/story context propagation
   - Premium/editorial tone handling

2. **Small business**
   - Service-led sections
   - Real testimonial pass-through
   - Contact channel shaping

3. **Landing page**
   - Conversion-first CTA language
   - Constraint handling (no jargon, readability)

4. **Personal brand**
   - Personal credibility framing
   - Friendly minimalist voice

5. **Edge cases**
   - Input trimming/sanitization
   - Custom tone/style notes
   - Empty/blank optional value cleanup

## Suggested dry-run checks

Use `buildWebsitePrompt()` and `buildPromptBundle()` with each fixture and verify:
- No assembly errors are thrown for valid input
- Required guardrails are present
- Output contract is consistently embedded
- Section prompts include only relevant injected data

## Refinement notes for Story 3-1

Prompt quality was iterated by:
- removing repetitive instruction wording and centralizing shared rules
- splitting section prompts to improve controllability and reduce token waste
- enforcing explicit no-fabrication rules in both global guardrails and section prompts
- enforcing JSON-only output expectation in core prompt
