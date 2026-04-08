# Website Navigation + Page Hierarchy Generation (ZLAP-STORY 3-5)

## Requirements and scope

This story adds an app-owned navigation and information architecture layer on top of Stories 3-1/3-2/3-3/3-4.

Supported in MVP:

- Typed page hierarchy with parent/child support and depth tracking
- Typed navigation schemas for header/footer/sidebar menus
- URL/path mapping with deterministic slug normalization and duplicate conflict resolution
- Default page sets by website type
- Ordering and priority rules (home first, contact last, conversion pages early)
- Label generation and fallback defaults
- Validation for hierarchy/menu integrity and path duplication
- Persistence in product DB (`website_navigation`)
- Frontend navigation rendering with active-state handling and mobile fallback menu
- Typed override support for labels, ordering, visibility, page parent relationships, add/remove pages

Navigation styles:

- top nav (header)
- footer nav
- optional sidebar nav foundation for nested pages

Hierarchy depth:

- MVP is mostly flat
- nested foundation is typed and renderable for future builder/editor use

## Architecture

```
lib/ai/navigation/
  types.ts
  schemas.ts
  defaults.ts
  hierarchy.ts
  generator.ts
  ordering.ts
  labels.ts
  paths.ts
  fallback.ts
  validation.ts
  overrides.ts
  state.ts
  storage.ts
  fixtures/*
  index.ts

components/generated-site/
  navigation-renderer.tsx
  navigation-menu.tsx
  mobile-navigation.tsx
  navigation-active-state.ts

app/api/ai/generate-navigation/route.ts
app/api/ai/regenerate-navigation/route.ts
```

## Data model

Page hierarchy model (`PageHierarchyNode`) tracks:

- `pageId`
- `slug` / `path`
- `parentPageId`
- `depth`
- `order` / `priority`
- `pageType` / `purpose`
- `visible`
- navigation inclusion flags (`includeInHeader`, `includeInFooter`, `includeInSidebar`)

Navigation schema (`WebsiteNavigation`) tracks:

- legacy `primary` + `footer` arrays for renderer compatibility
- normalized `menus[]` with location/style and nested `items[]`
- hierarchy snapshot (`hierarchy`)
- active path state (`activePath`)

Story 3-2 page model is extended (not duplicated) with hierarchy/navigation metadata fields:

- `parentPageId`
- `depth`
- `priority`
- `visible`
- `navigation`
- `navigationLabel`

## Default page sets by website type

- small-business: Home, About, Services, Contact
- portfolio: Home, Projects, About, Contact
- landing-page: Home, Features, Pricing, Contact
- personal-brand: Home, About, Work, Contact

## Generation flow

`structure pages + defaults + optional overrides -> hierarchy generation -> label/path/order resolution -> menu generation -> validation -> fallback recovery`

Integration points:

- Story 3-2 mapper now builds multi-page defaults and invokes centralized navigation generator
- Story 3-4 content mapping re-generates navigation after content mapping updates page messaging
- generated site renderer now uses dedicated navigation components and active-state logic

## URL and routing mapping

`lib/ai/navigation/paths.ts`:

- normalizes slugs to route-safe lowercase paths
- sanitizes unsafe characters
- ensures uniqueness by suffixing `-1`, `-2`, ... on collisions
- supports parent-aware nested path composition foundation

## Validation and fallback

`lib/ai/navigation/schemas.ts` validates:

- hierarchy node required fields
- menu/menu-item required fields
- duplicate hierarchy paths
- non-empty primary and menu sets

`lib/ai/navigation/validation.ts` falls back to deterministic defaults when validation fails.

## Storage

`supabase/migrations/20260408000000_website_navigation.sql` adds `public.website_navigation`:

- `id`
- `structure_id`
- `user_id`
- `hierarchy_json`
- `navigation_json`
- `version`
- `created_at`
- `updated_at`

`lib/ai/navigation/storage.ts` provides app-owned persistence APIs used by generation/regeneration routes.

## Customization and overrides

`NavigationOverrideInput` supports:

- label overrides
- order overrides
- visibility toggles
- parent reassignment for nesting
- add/remove pages

## Frontend navigation state

`components/generated-site/navigation-*`:

- active link state via `isNavigationItemActive`
- `aria-current` + data attributes for styling hooks
- mobile menu fallback via `<details>` renderer

## Extension guidance

Future builder/editor integration can write override payloads directly to the same typed model without replacing Story 3-2 page structures.
