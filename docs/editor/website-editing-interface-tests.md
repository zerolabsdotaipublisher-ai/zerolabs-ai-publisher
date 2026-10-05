# Website Editing Interface Test Scenarios (ZLAP-STORY 4-4)

## Scope

Validate editor route behavior, typed boundaries, preview updates, storage saves, validation, unsaved-change handling, responsive behavior, and accessibility.

## Core scenarios

1. **Load existing website**
   - Open `/editor/{id}` as owner
   - Verify structure loads and selectors initialize
   - Verify renderer canvas displays the selected page

2. **Edit text content**
   - Select section and modify heading/body/CTA fields
   - Confirm preview updates without full page reload
   - Confirm draft state is marked dirty

3. **Toggle section visibility**
   - Hide/show a section using section controls
   - Verify canvas reflects visibility changes immediately

4. **Reorder sections**
   - Move sections up/down in the selected page
   - Verify section order and preview order update
   - Save and confirm persisted order after reload

5. **Add and remove sections**
   - Add supported section types
   - Remove optional sections
   - Verify required-section guard prevents invalid removals

6. **Edit page settings**
   - Update page title, slug, visibility, and navigation label
   - Validate slug format errors are shown on invalid values

7. **Edit navigation**
   - Rename navigation labels
   - Reorder primary navigation
   - Toggle inclusion/exclusion in primary menu

8. **Edit style/theme entry points**
   - Change tone/style, layout template, and theme mode
   - Verify renderer data state updates in canvas

9. **Save draft**
   - Click save draft
   - Verify success status, dirty cleared, and persisted data loads on refresh

10. **Unsaved-change warning**
    - Make edits without saving
    - Attempt to close/refresh tab
    - Confirm browser unsaved-change warning appears

11. **Validation + error handling**
    - Trigger validation failures (invalid slug, invalid section state)
    - Confirm save blocks and error panel shows details

12. **Responsive + accessibility**
    - Verify sidebar/canvas/panels stack on small screens
    - Verify all controls are keyboard reachable and properly labeled
    - Verify save/error messages announce via `aria-live`

## Save Draft persistence regression coverage

Run these cases against an isolated Supabase test project with two authenticated
users: an Owner with a valid generated `website_structures` row, and a
Non-owner. Record the fixture structure, its version, and its navigation, SEO,
and version-row state before each case. Do not run these write scenarios against
shared production data.

1. **Authenticated owner save succeeds and persists the structure**
   - Send `POST /api/editor/save` as Owner with a valid draft and matching
     `structureId`.
   - Expect HTTP 200 and `ok: true`.
   - Reload `website_structures` and confirm the edited content, `updated_at`,
     and incremented version persisted.

2. **Navigation artifact persists**
   - Change a valid primary or footer navigation label/order.
   - Confirm `website_navigation` contains the saved structure ID, owner ID,
     version, hierarchy JSON, and expected navigation JSON.

3. **SEO artifact persists**
   - Change valid page SEO metadata and save.
   - Confirm `website_seo_metadata` contains an artifact for every saved page
     with the expected metadata, owner ID, and version.

4. **Version snapshot persists**
   - After a successful save, confirm one new `website_versions` row has
     source `draft_save`, status `draft`, the saved version, and matching
     snapshot content.

5. **Unauthenticated requests do not write**
   - Submit an otherwise-valid request without a session.
   - Expect HTTP 401 and `Unauthorized`.
   - Confirm the structure, navigation, SEO, and version rows are unchanged.

6. **Non-owners cannot save**
   - Submit Owner's structure ID and a valid-looking draft as Non-owner.
   - Expect HTTP 404 and `Structure not found`.
   - Confirm all Owner records are unchanged.

7. **Validation failures do not create partial writes**
   - Submit an invalid draft as Owner, such as duplicate page slugs or a page
     without a hero section.
   - Expect HTTP 422 with validation errors.
   - Confirm the pre-request structure, navigation, SEO, and version records
     are identical after the request.

Vitest now automates the local unit-testable contract through `npm test` and
`npm run test:unit`, including route auth/ownership boundaries, validation
short-circuiting, projections, version-snapshot inputs, and failure-stage
behavior. Database integration remains isolated: `npm run test:integration`
is reserved for a dedicated, non-production Supabase project and never runs
from the normal test command. The current implementation validates before the
structure write, which protects case 7. Artifact writes occur after the
structure write, and version snapshots are best-effort, so an artifact-storage
outage can still leave an updated structure without all artifacts; that is a
separate atomicity/retry improvement.

## Scenario references

- Scenario definitions: `lib/editor/scenarios.ts`
- Editor shell: `components/editor/website-editor-shell.tsx`
- Save API: `app/api/editor/save/route.ts`
- Reorder API: `app/api/editor/reorder-sections/route.ts`
- Navigation API: `app/api/editor/update-navigation/route.ts`
