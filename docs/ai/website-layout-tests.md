# Website Layout Generation Test Scenarios (ZLAP-STORY 3-3)

## Scope

These scenarios validate that page layout generation is deterministic, typed, validated, and renderer-compatible on top of Story 3-2 structures.

## Core scenarios

1. **Portfolio fixture** (`portfolioLayoutFixture`)
   - validates hero-first/content flow
   - validates service grid hints and metadata hooks

2. **Business fixture** (`businessSiteLayoutFixture`)
   - validates services-first tendencies and conversion ordering
   - validates contact/footer placement stability

3. **Landing fixture** (`landingPageLayoutFixture`)
   - validates short funnel ordering and minimal page depth
   - validates responsive hint defaults in CTA-heavy pages

4. **Personal brand fixture** (`personalBrandLayoutFixture`)
   - validates narrative flow and contact conversion placement
   - validates spacing/alignment defaults for content sections

5. **Edge-case fixture** (`edgeCaseLayoutFixture`)
   - validates override handling (template + visibility)
   - validates fallback safety for incomplete/missing sections

## Validation checks

For each scenario:

- `validateWebsiteLayoutModel(layout)` returns no errors, or fallback is applied by `ensureValidWebsiteLayout`
- each `PageLayoutModel` has:
  - valid `templateName`
  - non-empty `sectionLayouts`
  - responsive/alignment/spacing metadata populated
- all layout sections map back to original `WebsitePage.sections`
- frontend renders through `PageLayoutRenderer`/`SectionLayoutShell` without missing-node failures

## Integration checks

- `generateWebsiteStructure()` attaches `structure.layout`
- route responses include layout through `structure`
- generated site page renders using layout-aware renderer path

## Performance checks

- repeated `generatePageLayouts()` on identical structure + overrides returns cached model
- cache key invalidates when `updatedAt` or overrides change

## Required repo validation

- `npm install`
- `npm run lint`
- `npm run build`

## Regression guardrails

- no raw `process.env` access added in layout files
- no parallel structure model introduced
- layout remains app-owned under `lib/ai/layout`
