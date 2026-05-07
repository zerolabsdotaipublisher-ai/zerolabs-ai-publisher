# AI Content Regeneration (ZLAP-STORY 9-5)

## Scope

This MVP adds controlled regenerate-preview-apply for AI-generated:

- website/page content
- blog posts
- articles
- social posts

Regeneration logic is implemented in AI Publisher and reuses existing generation, editing, review, approval, revision, publishing, ownership, and observability systems.

## API surface

- `GET/POST /api/regeneration/[contentId]`
- `POST /api/regeneration/[contentId]/preview`
- `POST /api/regeneration/[contentId]/apply`

Preview never auto-overwrites content. Apply saves regenerated content as draft through existing editing storage workflow.

## Regeneration model

### Levels
- `full`
- `section`
- `field` (`headline`, `title`, `summary`, `cta`, `caption`)

### Modes
- `rewrite`
- `improve`
- `expand`
- `shorten`
- `simplify`
- `adjust_tone`

### Context used
- original prompt/source input when available
- current edited content draft
- keywords
- tone
- audience
- linked website/campaign
- current review/approval state summary

## Workflow integration

- Preview: generates a candidate draft and returns comparison summary.
- Apply:
  - validates regenerated structure/content
  - saves via existing editing storage (`saveOwnedEditableContent`)
  - creates `ai_regenerate` revision event in Story 9-4 revision system
  - re-enters review workflow using existing editing-to-review state transition rules
  - does not bypass approval workflow

## Observability

Server-side events are emitted for:

- `regeneration_started`
- `regeneration_succeeded`
- `regeneration_failed`
- `regeneration_applied`

## MVP boundaries

- Controlled regenerate-preview-apply only
- No autonomous or bulk regeneration
- No content overwrite without explicit apply
- No duplicate editor/CMS/revision pipeline
- No regeneration logic moved into `services/zeroflow`

## Task-to-file mapping (all 20 tasks)

1. Define Regeneration Requirements and Scope  
   - `docs/regeneration/ai-content-regeneration.md`, `lib/regeneration/scenarios.ts`
2. Define Regeneration Input and Context Model  
   - `lib/regeneration/types.ts`, `lib/regeneration/schema.ts`, `lib/regeneration/model.ts`
3. Design Regeneration UX and Interaction Flow  
   - `components/regeneration/regeneration-controls.tsx`, `components/regeneration/regeneration-options-panel.tsx`
4. Implement Regeneration Controls in UI  
   - `components/regeneration/regeneration-controls.tsx`, `components/review/review-action-bar.tsx`, `components/editing/content-editor-shell.tsx`, `components/content-library/content-library-card.tsx`
5. Implement Partial Regeneration (Section-Level)  
   - `lib/regeneration/workflow.ts`, `lib/regeneration/schema.ts`
6. Implement Full Content Regeneration  
   - `lib/regeneration/workflow.ts`, `app/api/regeneration/[contentId]/preview/route.ts`
7. Implement Regeneration Options (Rewrite, Expand, Shorten, etc.)  
   - `lib/regeneration/prompts.ts`, `components/regeneration/regeneration-options-panel.tsx`
8. Integrate Regeneration with AI Prompt System  
   - `lib/regeneration/prompts.ts`, `lib/regeneration/workflow.ts`
9. Implement Regeneration Result Handling  
   - `components/regeneration/regeneration-result-preview.tsx`, `components/regeneration/regeneration-compare-panel.tsx`, `lib/regeneration/validation.ts`
10. Implement Versioning for Regenerated Content  
    - `lib/regeneration/workflow.ts` (revision action + existing version increments from reused generators)
11. Integrate Regeneration with Editing Workflow  
    - `lib/regeneration/workflow.ts` (`saveOwnedEditableContent` reuse), `components/editing/content-editor-shell.tsx`
12. Integrate Regeneration with Review Workflow  
    - `lib/regeneration/workflow.ts`, `components/review/review-action-bar.tsx`
13. Implement Content Validation for Regeneration  
    - `lib/regeneration/validation.ts`, `lib/regeneration/schema.ts`
14. Implement Loading and Processing States  
    - `components/regeneration/regeneration-controls.tsx`
15. Implement Error Handling for Regeneration  
    - `app/api/regeneration/[contentId]/route.ts`, `app/api/regeneration/[contentId]/preview/route.ts`, `app/api/regeneration/[contentId]/apply/route.ts`, `components/regeneration/regeneration-controls.tsx`
16. Implement Access Control for Regeneration  
    - `lib/regeneration/permissions.ts`, `lib/regeneration/model.ts`, `app/api/regeneration/[contentId]/*`
17. Optimize Regeneration Performance and Cost  
    - `lib/regeneration/prompts.ts` (compact constraint shaping), `lib/regeneration/workflow.ts` (scope-aware regeneration)
18. Test Regeneration Across Scenarios  
    - `lib/regeneration/scenarios.ts`, `docs/regeneration/ai-content-regeneration-tests.md`
19. Monitor Regeneration Usage and Performance  
    - `lib/regeneration/metrics.ts`, `lib/regeneration/workflow.ts`
20. Document Regeneration Feature  
    - `docs/regeneration/ai-content-regeneration.md`, `docs/regeneration/ai-content-regeneration-tests.md`

