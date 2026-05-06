# Content Library (ZLAP-STORY 8-5)

This story implements a generated content library MVP in AI Publisher.

## Architecture alignment

- Content library logic is implemented inside AI Publisher app and libs.
- No content-library logic is introduced under `services/zeroflow`.
- Existing generated content, website management, scheduling, publishing status, dashboard, and ownership systems are reused.
- No duplicate CMS or storage system is introduced.
- No raw `process.env` usage is introduced outside config modules.

## Feature scope

Content library route: `/content`

Supported content types:

- websites/pages
- blog posts
- articles
- social posts

SEO metadata is included as linked supporting metadata on cards (not noisy standalone records).

## Data model summary

`lib/content/library/types.ts` defines:

- content item identity and type
- lifecycle status
- linked website/campaign metadata
- searchable keyword metadata
- quick-action capabilities
- paginated API response shape and filter/sort query model

## UI layout

- Page shell with heading, controls, list, and load-more behavior
- Controls for type/status/website filters, search, and sort
- Responsive card list with metadata and quick actions
- Loading skeleton, empty state, and retryable error state

## Data fetching and ownership

- API route: `GET /api/content/library`
- Server user authentication required
- All retrievals are owner-scoped by `user.id`
- Aggregation happens server-side in `lib/content/library/model.ts` + `storage.ts`
- Data sources reused:
  - `website_generated_content`
  - `blog_posts`
  - `article_posts`
  - `social_posts`
  - `website_seo_metadata`
  - management listing + content schedules

## Filters, search, sort, pagination

- Filters: content type, lifecycle status, linked website
- Search: title + metadata keywords/campaign/site labels
- Sorting: updated_desc (default), created_desc, title_asc
- Pagination: incremental loading via API `page/perPage` with `hasMore`

## Quick actions

- View/preview when route exists
- Edit when route exists
- Publish/schedule link when route exists
- Delete only where existing safe delete flow exists (`/api/content` archive flow)

## Dashboard integration

- Dashboard quick actions includes link to content library
- Dashboard content summary includes link to open content library
- App nav includes Content library link

## MVP boundaries

- Browse/manage generated content only; not a full CMS.
- Reuses existing ownership/access and publish/schedule flows.
- SEO metadata remains linked support metadata, not standalone content inventory.

## Task-to-file mapping (all 21 tasks)

1. Define Content Library Requirements  
   - `docs/content/content-library.md`, `lib/content/library/scenarios.ts`
2. Define Content Library Data Model  
   - `lib/content/library/types.ts`, `lib/content/library/schema.ts`
3. Design Content Library UI Layout  
   - `components/content-library/content-library-shell.tsx`, `components/content-library/content-library-controls.tsx`, `app/globals.css`
4. Implement Content Library Page Shell  
   - `app/(app)/content/page.tsx`, `components/content-library/content-library-shell.tsx`
5. Implement Content Card/List Item Component  
   - `components/content-library/content-library-card.tsx`
6. Implement Data Fetching for Content Library  
   - `app/api/content/library/route.ts`, `lib/content/library/model.ts`, `lib/content/library/storage.ts`
7. Implement Content Type Filtering  
   - `lib/content/library/filters.ts`, `components/content-library/content-library-controls.tsx`
8. Implement Search Functionality  
   - `lib/content/library/search.ts`, `components/content-library/content-library-shell.tsx`
9. Implement Sorting and Ordering Options  
   - `lib/content/library/model.ts`, `components/content-library/content-library-controls.tsx`
10. Display Content Status Indicators  
    - `lib/content/library/model.ts`, `components/content-library/content-library-card.tsx`, `app/globals.css`
11. Implement Quick Actions for Content Items  
    - `lib/content/library/model.ts`, `components/content-library/content-library-card.tsx`, `components/content-library/content-library-shell.tsx`
12. Implement Empty State for Content Library  
    - `components/content-library/content-library-empty-state.tsx`, `components/content-library/content-library-shell.tsx`
13. Implement Loading State  
    - `components/content-library/content-library-loading.tsx`, `components/content-library/content-library-shell.tsx`
14. Implement Error Handling  
    - `app/api/content/library/route.ts`, `components/content-library/content-library-shell.tsx`
15. Implement Pagination or Infinite Scroll  
    - `lib/content/library/model.ts`, `components/content-library/content-library-shell.tsx`
16. Implement Responsive Design  
    - `app/globals.css`, `components/content-library/content-library-shell.tsx`
17. Implement Access Control and Ownership Validation  
    - `app/(app)/content/page.tsx`, `app/api/content/library/route.ts`, `lib/content/library/storage.ts`
18. Integrate Content Library with Dashboard  
    - `lib/dashboard/schema.ts`, `components/dashboard/dashboard-content-summary.tsx`, `config/routes.ts`
19. Optimize Performance of Content Library  
    - `lib/content/library/storage.ts`, `lib/content/library/model.ts`
20. Test Content Library Across Scenarios  
    - `lib/content/library/scenarios.ts`, `docs/content/content-library-tests.md`
21. Document Content Library Feature  
    - `docs/content/content-library.md`, `docs/content/content-library-tests.md`
