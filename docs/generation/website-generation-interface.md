# Website Generation Interface (ZLAP-STORY 4-2)

## Purpose

The website generation interface is the operational execution layer for Story 4-1. It receives wizard inputs, validates them, orchestrates the existing EPIC 3 AI generation pipeline, and hands users into generated-site preview.

## Entry and integration

- Wizard input collection remains in `/create`.
- Review confirmation in the wizard routes users to `/generate`.
- `/generate` restores wizard inputs from shared local storage and runs generation without re-entering data.

## Interface requirements

The interface provides:

1. Input area with editable wizard-aligned fields.
2. Action area for generate, retry, edit, reset, preview, and return-to-wizard.
3. Status area with idle, in-progress, success, and failure states.
4. Output handoff via generated-site preview link (`/generated-sites/{id}`).

## State model

`lib/generation/state.ts` and `lib/generation/types.ts` centralize:

- input payload
- validation errors
- submission status (`idle`, `validating`, `running`, `success`, `error`)
- staged progress (`preparing`, `structure`, `content`, `finalizing`)
- generation result (structure ID, preview path, completion timestamp, error)
- retry count
- input editing mode

## Validation

`lib/generation/validation.ts` reuses Story 4-1 review validation (`validateReviewStep`) so required fields and format checks remain consistent between wizard and generation interface.

## Submission flow

`lib/generation/submit.ts` orchestrates existing endpoints only:

1. `POST /api/ai/generate-structure`
2. `POST /api/ai/generate-content` with `structureId`
3. map success to `routes.generatedSite(structureId)`

No parallel generator is introduced.

## Loading, success, and failure UX

- Loading state surfaces explicit pipeline stages.
- Success state confirms completion and exposes preview handoff.
- Failure state preserves inputs and supports retry/regenerate.

## Edit and regenerate

The interface supports:

- editing inputs after failure or success
- retrying failed generation
- regenerating with updated inputs
- resetting to default input baseline

## Accessibility and responsive behavior

- status/error/success regions use `aria-live`
- loading state uses `aria-busy`
- action controls stay keyboard-accessible and disabled appropriately while running
- layout stacks to one column on small screens for touch-first operation

## Analytics/event tracking

`lib/generation/tracking.ts` sends key interface events to `POST /api/observability/events`, and the server route logs them through the existing observability logger.

Tracked actions:

- generation started
- generation completed
- generation failed
- retry clicked
- edit inputs clicked
- preview opened

## Task-to-file coverage summary

1. Requirements: `docs/generation/website-generation-interface.md`
2. Base layout: `components/generation/generation-layout.tsx`, `app/(app)/generate/page.tsx`
3. Input collection: `components/generation/generation-input-panel.tsx`
4. Validation/error: `lib/generation/validation.ts`, `components/generation/generation-error-state.tsx`
5. State management: `lib/generation/state.ts`, `lib/generation/types.ts`
6. Submission action: `lib/generation/submit.ts`
7. Loading states: `components/generation/generation-loading-state.tsx`, `components/generation/generation-status-panel.tsx`
8. Success state: `components/generation/generation-success-state.tsx`
9. Failure/retry: `components/generation/generation-error-state.tsx`, `components/generation/website-generation-interface.tsx`
10. Wizard integration: `components/wizard/website-creation-wizard.tsx`
11. Preview integration: `components/generation/generation-preview-link.tsx`
12. Edit/regenerate: `components/generation/generation-actions.tsx`, `components/generation/website-generation-interface.tsx`
13. Responsive behavior: `app/globals.css` (generation styles)
14. Accessibility: generation components + aria attributes
15. Event tracking: `lib/generation/tracking.ts`, `app/api/observability/events/route.ts`
16. End-to-end testing design: `docs/generation/website-generation-interface-tests.md`, `lib/generation/scenarios.ts`
17. Implementation documentation: this document
