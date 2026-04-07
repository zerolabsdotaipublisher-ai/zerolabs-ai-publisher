# Website Content Generation Test Scenarios (ZLAP-STORY 3-4)

## Scope

Validate typed, validated, storable, and renderer-compatible content generation for all supported website categories.

## Fixtures

Located in `lib/ai/content/fixtures/`:

- `portfolio.ts`
- `business-site.ts`
- `landing-page.ts`
- `personal-brand.ts`
- `edge-cases.ts`

## Scenario coverage

1. **Portfolio**
   - premium/focused voice alignment
   - concise hero + service positioning

2. **Small business**
   - services-first informational clarity
   - conversion CTA + contact readiness

3. **Landing page**
   - concise, conversion-heavy density
   - trust microcopy consistency

4. **Personal brand**
   - friendly credibility storytelling
   - about/benefits consistency across pages

5. **Edge cases**
   - custom tone/style notes
   - fallback coverage for sparse/irregular input

## Validation checks

For each scenario:

- `validateGeneratedWebsiteContent(content)` returns no critical shape errors
- `evaluateContentQuality(content)` flags no filler/unsupported claims
- section contracts are satisfied for required fields
- length/density constraints are respected
- `applyGeneratedContentToStructure` keeps section payloads renderer-compatible

## API checks

- `POST /api/ai/generate-content` stores generated content rows and updates mapped structure
- `POST /api/ai/regenerate-content` regenerates content and updates structure version

## Multi-page checks

- Existing structure pages are generated
- default content pages (`/`, `/about`, `/services`, `/contact`) are produced when absent
- consistent tone/style across all generated pages

## Required repository validation

- `npm install`
- `npm run lint`
- `npm run build`

## Regression guardrails

- no raw `process.env` access outside config layer
- no duplicated prompt system
- no UI-level hardcoded generation logic
- content persistence remains app-owned in AI Publisher
