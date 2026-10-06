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

## Canonical document registry/renderer coverage (Slice 2)

The normal unit suite also validates the isolated canonical document boundary:

- component registry lookup/default cloning, required/typed props, safe links,
  slot containment, style capability restrictions, assets, and symbols;
- recursive document rendering with ordered children, visibility, global
  header/footer, typed page/node/external navigation, CTA links, and media;
- adapter parity for representative generated sites, multiple routes, hidden
  and reordered sections, SEO metadata availability, and explicit legacy
  fallback content.

These are local render/contract tests only. The document renderer is not the
production website renderer and does not save to Supabase in this slice.

## Canonical persistence projection coverage (Slice 3A)

The local unit suite now proves the future persistence boundary without a
database connection:

- deterministic, non-mutating `EditorDocument → WebsiteStructure`
  compatibility projection;
- supported `WebsiteStructure → EditorDocument → WebsiteStructure` semantic
  round trips for pages, sections, hidden/reordered content, CTA/media data,
  navigation, SEO, and existing legacy sections;
- explicit projectability failures for canonical layout/visibility/global
  changes that the active renderer cannot represent;
- typed navigation resolution after page-route changes, including safe external
  destinations and menu ordering/visibility;
- deterministic current SEO package/row projections and supported Open Graph
  data;
- version snapshot v2 alongside schema-v1 recognition/read compatibility;
- future atomic-save HTTP contract mapping for stale revisions (`409`) and
  validation/projectability failures (`422`).

These tests do not call Supabase and do not alter the active Save Draft route.
Database rollback/failure-injection tests remain a separate Slice 3B task on
isolated Supabase infrastructure.

## Isolated atomic-persistence foundation (Slice 3B)

`tests/integration/editor-save/isolated-atomic-persistence.test.ts` provides a
database-only, disposable schema test for the future
`save_editor_document` transaction. It is deliberately not connected to the
current production Save Draft route, live tables, migration ledger, renderer,
or deployment path.

Before it makes any destructive connection, the harness requires exact
`ZERO_ENV=test`, distinct `ZERO_TEST_*` credentials, and either a local target
or an explicit `ZERO_TEST_PROJECT=dedicated` marker. It rejects a missing or
unsafe environment marker (`prod`, `production`, `qa`, or any non-`test`
value), placeholders, and credentials that duplicate normal application
configuration. It then constructs and removes its own `zero_slice3b` schema;
the integration test is skipped with a reason when the required non-production
Supabase/`psql` setup is absent.

The executable cases establish the following transaction contract:

- an owner save commits the canonical document, compatibility structure,
  navigation projection, SEO rows, v2 snapshot, and exactly one revision;
- stale revisions return an in-transaction conflict without a write;
- anonymous, non-owner, malformed-document, and preflight-unprojectable cases
  leave stored state unchanged;
- disposable trigger failpoints at structure, navigation, SEO, and version
  stages roll back all preceding writes; and
- a legacy direct structure write increments `editor_revision`, so an older
  editor session receives a conflict rather than overwriting it.

The tested RPC is explicitly `SECURITY INVOKER`, derives identity only from
`auth.uid()`, has no browser-supplied user ID parameter, retains RLS on every
test table, revokes `PUBLIC`/`anon` execution, and grants execution only to
`authenticated`. The test-only seed, state-inspection, legacy-write, and
failure-injection helpers are restricted to `service_role`; they are not part
of the future production interface. This proves the proposed invoker/RLS model
against Supabase semantics, but a production migration is intentionally
deferred until Slice 3C, after review of this harness and its exact schema
mapping.

## Scenario references

- Scenario definitions: `lib/editor/scenarios.ts`
- Editor shell: `components/editor/website-editor-shell.tsx`
- Save API: `app/api/editor/save/route.ts`
- Reorder API: `app/api/editor/reorder-sections/route.ts`
- Navigation API: `app/api/editor/update-navigation/route.ts`
