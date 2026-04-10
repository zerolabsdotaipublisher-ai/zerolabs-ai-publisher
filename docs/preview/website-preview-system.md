# Website Preview System (ZLAP-STORY 4-3)

## Purpose and scope

Preview is the post-generation experience layer for AI Publisher. It reuses the existing generated-site rendering pipeline and structure contracts from EPIC 3 and Stories 4-1/4-2, then adds:

- dedicated preview routes
- preview state and controls (page/device/refresh/share)
- loading and error handling
- secure access checks for owner and shared preview

## MVP previewable surfaces

- generated pages and section content
- generated navigation (header/footer links)
- generated style/theme metadata from structure/layout
- responsive preview device modes (desktop/tablet/mobile)
- read-only preview interaction (no visual editor)

## Non-goals

- no second renderer
- no full WYSIWYG editor
- no alternate generation pipeline

## Data and rendering model

- `lib/preview/types.ts`: preview model, page options, permissions, device/access modes
- `lib/preview/model.ts`: maps generated `WebsiteStructure` + query state into `WebsitePreviewModel`
- rendering continues through `components/generated-site/renderer.tsx`

The preview layer wraps existing generated data and passes selected page/device context into the same renderer.

## Route structure

- Owner preview: `/preview/[id]`
- Shared preview: `/preview/share/[token]`
- Share creation API: `POST /api/preview/share`
- Share resolution API: `GET /api/preview/resolve?token=...`

## Navigation and responsive controls

- `preview-page-navigation.tsx`: multi-page switching from generated pages
- `preview-device-switcher.tsx`: desktop/tablet/mobile frame switching
- query keys: `page`, `device`, `r` (refresh key)

## Loading and error handling

- `components/preview/preview-loading-state.tsx`
- `components/preview/preview-error-state.tsx`
- route-level loading/error files for owner and shared preview routes

## Security and isolation

- owner preview fetch is scoped by authenticated user + structure ownership
- shared preview requires a signed expiring token
- token verification validates signature, expiry, structure ownership reference
- preview only renders product-owned generated structure data

## Share behavior

- only owners can create share links from preview toolbar
- generated links are signed and time-limited
- shared route is read-only mode

## Controls and actions

- page switch
- device switch
- refresh preview (lightweight live-update foundation)
- create/copy share link (owner)
- open generated-site route and return-to-generation links

## Performance considerations

- reusable query-state updates to avoid redundant state churn
- device-class switching only changes preview frame wrapper
- renderer key includes page/device/refresh for deterministic refresh behavior

## Generation flow integration

- Story 4-2 output handoff now points to `routes.previewSite(id)`
- flow: wizard (`/create`) -> generation (`/generate`) -> preview (`/preview/{id}`)

## Live update foundation

MVP includes a refresh action that invalidates preview view state (`r` query key) and re-renders the current page/device selection. This is the extension point for future polling/stream updates.

## Task-to-file coverage

1. Requirements/scope: this document  
2. Preview data model: `lib/preview/types.ts`, `lib/preview/model.ts`  
3. Preview rendering engine: `components/preview/website-preview-shell.tsx` + existing `components/generated-site/renderer.tsx`  
4. Multi-page navigation: `components/preview/preview-page-navigation.tsx`  
5. Responsive modes: `components/preview/preview-device-switcher.tsx`  
6. Styling/theme application: preview shell data attributes + existing generated-site renderer/layout metadata  
7. Loading states: `preview-loading-state.tsx`, route loading files  
8. Error handling: `preview-error-state.tsx`, route error files  
9. Generation handoff integration: `lib/wizard/mapping.ts`, `config/routes.ts`  
10. Live update foundation: refresh key/state in `lib/preview/state.ts`, toolbar refresh action  
11. Isolation/security: `lib/preview/security.ts`, preview routes, share API ownership checks  
12. URL/sharing: preview routes + `app/api/preview/share/route.ts`, `app/api/preview/resolve/route.ts`, `lib/preview/sharing.ts`  
13. Controls/actions: preview toolbar + share actions + page/device switch controls  
14. Performance: `lib/preview/performance.ts`, lightweight keyed rendering strategy  
15. Testing coverage: `docs/preview/website-preview-tests.md`, `lib/preview/scenarios.ts`  
16. Documentation: this document
