# Website Creation Wizard Design (ZLAP-STORY 4-1)

## Purpose and goals

The website creation wizard is an app-owned Layer 1 product flow in AI Publisher that takes users from blank state to generated website output by collecting product-owned inputs and handing those inputs into the existing EPIC 3 AI generation pipeline.

Goals:

1. Guide users through a clear, low-friction multi-step input flow.
2. Preserve user inputs while navigating and backtracking.
3. Validate required fields early and show friendly errors.
4. Allow optional depth without blocking generation.
5. Confirm final inputs before generation.
6. Run the existing generation pipeline and surface loading/success states.

MVP boundaries:

- Includes wizard UX architecture, state model, typed schemas, validation, review, loading, and success experience.
- Includes integration mapping to existing `generate-structure` + `generate-content` endpoints.
- Excludes advanced in-place editing/WYSIWYG editor.
- Excludes creating any separate generation pipeline.

## Entry points and journey

Entry points:

- Dashboard CTA (`/dashboard` -> `/create`)
- App header quick access (`Create website`)

Journey:

1. Select website type
2. Add business info
3. Select style and tone
4. Optionally add advanced content inputs
5. Review and confirm
6. Loading/generation status
7. Success with output entry link (`/generated-sites/{id}`)

## Wizard step structure

Step model is defined in `lib/wizard/steps.ts` and `lib/wizard/types.ts`.

Form steps:

1. `website-type` (required)
2. `business-info` (required)
3. `style-theme` (required)
4. `content-input` (optional/skippable)
5. `review-confirm` (required)

System steps:

6. `loading`
7. `success`

Each step includes: `id`, `title`, `purpose`, `required`, `skippable`.

## Inputs and data requirements

Typed input schema is defined in `lib/wizard/types.ts` + defaults/options in `lib/wizard/schemas.ts`.

Required input path:

- `websiteType`
- `brandName`
- `description`
- `targetAudience`
- `services[]` (at least one)
- `primaryCta`
- `style`
- `tone`

Optional input path:

- `customToneNotes`, `customStyleNotes`
- `founderProfile`
- `testimonials[]`
- `contactInfo` (`email`, `phone`, `location`, `socialLinks[]`)
- `constraints[]`

## Wireframe-level UI architecture

UI scaffolding is implemented in `components/wizard/*`:

- `website-creation-wizard.tsx` (stateful flow orchestrator)
- `wizard-shell.tsx` (container + heading)
- `wizard-stepper.tsx` (step list)
- `wizard-progress.tsx` (progress bar + labels)
- `wizard-navigation.tsx` (back/next/skip)
- `wizard-review.tsx` (summary + edit actions)
- `wizard-loading.tsx` (multi-stage loading status)
- `wizard-success.tsx` (output entry actions)
- `steps/*` (step-specific input layouts)

Design intent is wireframe-level structure with production-ready flow scaffolding, not final visual polish.

## Progress and step indicators

Progress UX shows:

- Current step index and total steps
- Step title label
- Progress bar percentage
- Stepper completion/current state

`loading` and `success` are shown as system states after form completion.

## Validation and error states

Validation rules in `lib/wizard/validation.ts`:

- Field-level required checks
- Format checks (email)
- Step-level blocking errors
- Review-level consolidated validation

Error UX:

- Step-specific error panel with friendly copy
- Generation error surfaced on review for retry

## Required vs optional flow

- `content-input` step is marked `skippable: true`.
- Optional fields inside steps never block forward progress unless partially malformed (example: testimonial with quote but missing author).
- Required steps and fields block progression until valid.

## Style/theme and content customization

- Style and tone presets align with existing EPIC 3 prompt contracts (`StylePreset`, `TonePreset`).
- Custom notes are required when `custom` is selected.
- Content customization step captures structured optional inputs that map to the existing `WebsiteGenerationInput` shape.

## Review and confirmation

Review step includes:

- Summary of each step’s inputs
- Edit links to jump back to earlier steps
- Clear generate action (`Generate website`)

## Loading and success UX

Loading UX:

- Stage-based status labels:
  - preparing inputs
  - generating structure/layout
  - generating content/navigation/SEO
  - finalizing output
- Avoids dead-end spinner-only behavior.

Success UX:

- Completion state message
- Direct link to generated output route
- “Create another website” reset action

## Navigation and backtracking behavior

State helpers in `lib/wizard/state.ts` define:

- initial state
- next/back step traversal
- nested data merge behavior
- list normalization utilities

Backtracking behavior:

- Previous steps are editable without losing entered values.
- Review step supports direct jump-back edits.
- Draft state is persisted in localStorage (`WIZARD_STORAGE_KEY`) until success.

## Mobile and responsive behavior

Wizard layout uses responsive CSS in `app/globals.css`:

- Stepper wraps on small screens
- Choice cards collapse to single-column layout
- Navigation buttons stack on small screens
- Input groups shift from 2-column to 1-column

## State management requirements

`WebsiteCreationWizardState` (`lib/wizard/types.ts`) includes:

- `currentStep`
- `completedSteps`
- `data` (typed wizard input)
- `stepErrors`
- `generationStatus`
- `generationResult`

This keeps wizard state explicit, typed, and integration-ready.

## AI integration points (existing EPIC 3 pipeline)

Mapping and integration definitions live in `lib/wizard/mapping.ts`.

Wizard -> pipeline mapping:

1. Wizard input mapped to `WebsiteGenerationInput` via `mapWizardInputToGenerationInput`.
2. POST `/api/ai/generate-structure` (existing structure/layout/navigation/seo flow).
3. POST `/api/ai/generate-content` with `structureId` (existing content + refreshed navigation/seo flow).
4. Navigate to generated output path from `routes.generatedSite(id)`.

No duplicate generator contract or parallel pipeline is introduced.

## Scenario testing design

Scenario set is defined in:

- `lib/wizard/scenarios.ts`
- `docs/wizard/website-creation-wizard-tests.md`

Coverage includes:

- Business full-input path
- Portfolio low-input path
- Personal-brand backtracking/edit flow
- Mobile responsive path

## Task-to-file coverage summary

1. Goals/journey: this doc + `/create` entry flow
2. Step structure: `lib/wizard/steps.ts`, `lib/wizard/types.ts`
3. Input/data requirements: `lib/wizard/types.ts`, `lib/wizard/schemas.ts`
4. Wireframes: `components/wizard/*`, `components/wizard/steps/*`
5. Progress indicators: `wizard-progress.tsx`, `wizard-stepper.tsx`
6. Validation/error states: `lib/wizard/validation.ts`, `website-creation-wizard.tsx`
7. Required vs optional flow: step config + validation + skip navigation
8. Style/theme step: `steps/step-style-theme.tsx`
9. Content/customization step: `steps/step-content-input.tsx`
10. Review/confirm step: `wizard-review.tsx`, `steps/step-review-confirm.tsx`
11. Loading/generation UX: `wizard-loading.tsx`, orchestrator state
12. Success/output entry: `wizard-success.tsx`
13. Navigation/backtracking: `wizard-navigation.tsx`, `lib/wizard/state.ts`, orchestrator
14. Mobile/responsive UX: wizard CSS in `app/globals.css`
15. State model requirements: `lib/wizard/types.ts`, `lib/wizard/state.ts`
16. Integration points: `lib/wizard/mapping.ts`, orchestrator generation flow
17. Scenario tests: `docs/wizard/website-creation-wizard-tests.md`, `lib/wizard/scenarios.ts`
18. Design documentation: this document
