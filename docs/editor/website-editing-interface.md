# Website Editing Interface (ZLAP-STORY 4-4)

## Purpose and scope

The editor is the Layer 1 product-owned editing interface for generated websites.  
Its active production path extends existing generation + preview + storage systems and does **not yet** introduce a second website model or renderer.

## MVP editable requirements

- Edit page title/name, slug, visibility, and navigation label
- Edit section text fields, visibility, and order
- Add/remove/reorder supported sections
- Edit navigation labels/order/visibility inclusion
- Edit style/theme entry points (tone/style/layout template/theme mode)
- Save draft changes to existing website storage
- Near-real-time preview updates by reusing `components/generated-site/renderer.tsx`
- Unsaved-change warning and explicit save feedback
- Validation and error handling for invalid draft updates

## Editable boundaries

Defined in `lib/editor/boundaries.ts`:

- Editable:
  - `siteTitle`, `tagline`
  - `pages[].title`, `pages[].slug`, `pages[].visible`, `pages[].navigationLabel`
  - `pages[].sections[].visible`, `pages[].sections[].order`, `pages[].sections[].content`
  - `navigation.primary[]` and `navigation.footer[]` labels/hrefs/inclusion
  - `styleConfig.tone`, `styleConfig.style`
  - `layout.pages[].templateName`, `layout.pages[].metadata.themeMode`
- System-managed:
  - `id`, `userId`, `generatedAt`, `updatedAt`, `version`, `status`, `publication`, `sourceInput`, `contentVariations`

## Architecture

- Route: `app/(app)/editor/[id]/page.tsx`
- Shell: `components/editor/website-editor-shell.tsx`
- State and domain logic: `lib/editor/*`
- Save API: `POST /api/editor/save`
- Targeted APIs: `POST /api/editor/reorder-sections`, `POST /api/editor/update-navigation`

## Preview relationship

- Live canvas uses existing `Renderer` component
- Editor draft state is passed directly into renderer
- No secondary render pipeline is introduced

## Save draft flow

1. Client validates draft via `lib/editor/validation.ts`
2. Client sends draft to `POST /api/editor/save`
3. Server saves through `lib/editor/storage.ts`:
   - `updateWebsiteStructure`
   - `storeWebsiteNavigation`
   - `storeWebsiteSeoMetadata`
4. Save status and errors are surfaced in editor toolbar/error panel

## Canonical document foundation (Slice 1)

`lib/editor/document/` now defines the versioned, canonical editor-document
contract planned for the next editor phase. It models stable page and node IDs,
ordered slots, typed responsive visibility and style tokens, SEO, media asset
references, global header/footer components, reusable symbols, and navigation
targets that reference page or node IDs rather than only URL strings.

The Slice 1 adapter, `adaptWebsiteStructureToEditorDocument`, is deliberately
read-only. It converts an existing `WebsiteStructure` into an
`EditorDocument` deterministically, without database writes, input mutation,
render normalization, or synthetic marketing sections. Hidden sections remain
hidden; legacy or unsupported section types remain explicit `legacy.*` nodes
with their safe JSON content preserved.

This document is **not yet used** by the current renderer, Save Draft route,
or Supabase persistence. `WebsiteStructure` remains the active production
model until a later reviewed slice introduces registry-backed rendering and
transactional canonical-document persistence. Existing generated websites
therefore continue to render through the current compatibility path.

Structural validation in `lib/editor/document/validation.ts` verifies schema
version, stable references, tree cycles, navigation references, visibility,
and supported style-token shapes. Component registry rules are intentionally
out of scope until Slice 2.

## Regenerate vs edit workflow

- Generation remains in `/generate` and `/api/ai/*`
- Preview remains in `/preview/[id]`
- Editor works on persisted generated structures and saves draft revisions

## Non-goals

- No collaborative multi-user editing
- No full visual drag-and-drop builder
- No new platform-owned editing service
- No raw `process.env` access in editor code

## Accessibility and responsive behavior

- Keyboard-accessible controls for page/section/navigation management
- `aria-live` feedback for save/error status
- Before-unload warning for unsaved changes
- Responsive editor layout stacks on narrow screens

## Task-to-file coverage (Story tasks 1-21)

1. Requirements: this document  
2. Editable model/boundaries: `lib/editor/types.ts`, `lib/editor/model.ts`, `lib/editor/boundaries.ts`  
3. Layout design: `components/editor/website-editor-shell.tsx`, `app/globals.css` editor styles  
4. Base shell: `app/(app)/editor/[id]/page.tsx`, `components/editor/website-editor-shell.tsx`  
5. Page/section selection: `editor-page-selector.tsx`, `editor-section-selector.tsx`, `editor-sidebar.tsx`  
6. Text editing: `editor-text-panel.tsx`, `lib/editor/boundaries.ts`, `lib/editor/sections.ts`  
7. Section-level controls: `editor-section-selector.tsx`, `lib/editor/sections.ts`  
8. Page-level controls: `editor-page-settings-panel.tsx`  
9. Navigation controls: `editor-navigation-panel.tsx`, `lib/editor/navigation.ts`  
10. Style/theme entry points: `editor-style-panel.tsx`  
11. Near-real-time preview updates: `editor-canvas.tsx`, `lib/editor/preview-sync.ts`  
12. Save draft: `lib/editor/save.ts`, `app/api/editor/save/route.ts`, `lib/editor/storage.ts`  
13. Unsaved changes: `lib/editor/dirty.ts`, `editor-unsaved-warning.tsx`  
14. Validation/errors: `lib/editor/validation.ts`, `editor-error-state.tsx`  
15. Add/remove/reorder sections: `lib/editor/sections.ts`, `editor-section-selector.tsx`, `/api/editor/reorder-sections`  
16. State management: `lib/editor/state.ts`, `lib/editor/model.ts`  
17. Storage integration: `lib/editor/storage.ts`, existing `lib/ai/*/storage.ts`  
18. Responsive behavior: editor CSS in `app/globals.css`  
19. Accessibility: labels, keyboard controls, aria-live status in editor components  
20. End-to-end scenario definitions: `docs/editor/website-editing-interface-tests.md`, `lib/editor/scenarios.ts`  
21. Implementation docs: this document
