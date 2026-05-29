# AI Content Review Interface (ZLAP-STORY 9-1)

This story adds an owner-scoped AI Content Review workflow MVP inside AI Publisher.

## Architecture alignment

- Review logic is implemented in AI Publisher (`app`, `lib`, `components`) and not in `services/zeroflow`.
- Existing content storage, preview, editor, regeneration, publishing status, dashboard, and content library systems are reused.
- Review states are persisted in a dedicated `ai_content_reviews` table while existing content status models remain intact.
- No duplicate CMS/editor/publishing pipeline is introduced.
- No raw `process.env` usage is introduced outside config layer.

## Supported content

- website/page content
- blog posts
- articles
- social posts

## Review state model

States:

- `pending_review`
- `approved`
- `rejected`
- `needs_changes`
- `published` (derived from existing content lifecycle status)

Persisted decision states are `pending_review`, `approved`, `rejected`, `needs_changes`.
Published is a derived state from existing content status.

## UI/UX scope

Routes:

- `/review`
- `/review/[contentId]`

List UI includes:

- filters (type/state), search, sort
- review cards with status indicators and metadata
- links to review detail, preview, and existing editor where available
- loading, empty, error, and incremental loading states

Detail UI includes:

- status badge
- metadata/context panel (type, title, dates, status, website/campaign, SEO/keywords)
- realistic preview (existing website preview links or social preview rendering)
- approve/reject/needs-changes/regenerate controls
- edit integration via existing editor links
- inline editing (MVP: social title + reviewer note)
- version comparison and comments surfaced as future-ready

## API surface

- `GET/POST /api/review`
- `GET/PATCH /api/review/[contentId]`
- `POST /api/review/[contentId]/approve`
- `POST /api/review/[contentId]/reject`
- `POST /api/review/[contentId]/regenerate`

## Publishing workflow integration

Publishing routes now consult review decisions by structure:

- `POST /api/publish`
- `POST /api/publish/update`

Publishing is blocked when linked review decisions contain `rejected` or `needs_changes`.

## Performance approach

- Server-side aggregation reuses existing content-library model/storage.
- Review list maps persisted review decisions onto aggregated content in one server pass.
- Avoids per-card API fan-out for state indicators.

## MVP boundaries

- Review is owner-scoped and single-reviewer for MVP.
- Full collaborative comments/threads are future-ready.
- Rich side-by-side version diffs are future-ready; existing version history links are reused.
- Inline content editing is intentionally narrow (social title) while primary edit actions route to existing editors.

## Task-to-file mapping (all 21 tasks)

1. Define Content Review Requirements  
   - `docs/review/ai-content-review-interface.md`, `lib/review/scenarios.ts`
2. Define Review State Model  
   - `lib/review/types.ts`, `lib/review/schema.ts`, `supabase/migrations/20260506232000_ai_content_reviews.sql`
3. Design Review Interface UI/UX  
   - `components/review/review-shell.tsx`, `components/review/review-list.tsx`, `components/review/review-action-bar.tsx`
4. Implement Review Interface Layout  
   - `app/(app)/review/page.tsx`, `app/(app)/review/[contentId]/page.tsx`, `app/globals.css`
5. Implement Content Preview Component  
   - `components/review/review-content-preview.tsx`
6. Implement Approve and Reject Controls  
   - `components/review/review-action-bar.tsx`, `app/api/review/[contentId]/approve/route.ts`, `app/api/review/[contentId]/reject/route.ts`
7. Implement Edit and Inline Editing Capability  
   - `components/review/review-action-bar.tsx`, `app/api/review/[contentId]/route.ts`, `lib/review/model.ts`
8. Implement Regeneration Controls  
   - `components/review/review-action-bar.tsx`, `app/api/review/[contentId]/regenerate/route.ts`, `lib/review/workflow.ts`
9. Display Content Metadata and Context  
   - `components/review/review-metadata-panel.tsx`, `lib/review/model.ts`
10. Implement Version Comparison optional/future-ready  
    - `lib/review/model.ts`, `components/review/review-metadata-panel.tsx`
11. Implement Review Status Indicators  
    - `components/review/review-status-badge.tsx`, `components/review/review-list.tsx`, `components/review/review-action-bar.tsx`, `app/globals.css`
12. Implement Commenting or Feedback System optional/future-ready  
    - `components/review/review-action-bar.tsx`, `lib/review/types.ts`, `lib/review/model.ts`, `app/api/review/[contentId]/route.ts`
13. Implement Access Control for Review Actions  
    - `app/(app)/review/page.tsx`, `app/(app)/review/[contentId]/page.tsx`, `app/api/review/**`, `lib/review/permissions.ts`
14. Integrate Review Interface with Content Storage  
    - `lib/review/model.ts`, `lib/review/storage.ts`, `supabase/migrations/20260506232000_ai_content_reviews.sql`
15. Integrate Review Interface with Publishing Workflow  
    - `lib/review/workflow.ts`, `app/api/publish/route.ts`, `app/api/publish/update/route.ts`
16. Implement Loading and Transitional States  
    - `components/review/review-shell.tsx`, `components/review/review-action-bar.tsx`
17. Implement Error Handling for Review Actions  
    - `app/api/review/**`, `components/review/review-shell.tsx`, `components/review/review-action-bar.tsx`
18. Implement Responsive Design  
    - `app/globals.css`, `components/review/*`
19. Test AI Content Review Interface Across Scenarios  
    - `lib/review/scenarios.ts`, `docs/review/ai-content-review-interface-tests.md`
20. Optimize Performance of Review Interface  
    - `lib/review/model.ts`, `lib/review/storage.ts`
21. Document AI Content Review Interface  
    - `docs/review/ai-content-review-interface.md`, `docs/review/ai-content-review-interface-tests.md`
