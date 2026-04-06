# Website Page Layout Generation (ZLAP-STORY 3-3)

## Overview

Story 3-3 extends the existing Story 3-1 (prompts) and Story 3-2 (website structure) pipeline by adding an app-owned layout engine that maps `WebsiteStructure` into a typed, validated `WebsiteLayoutModel`.

Pipeline:

`AI prompt output` → `WebsiteStructure` → `generatePageLayouts(structure)` → `layout-aware rendering`

The layout layer is product-owned in AI Publisher (Layer 1) and does not introduce any ZeroFlow platform coupling.

## Architecture

```
lib/ai/layout/
  types.ts        # Layout model types
  schemas.ts      # Layout schema validation
  templates.ts    # Variants and template defaults
  mapper.ts       # WebsiteStructure -> WebsiteLayoutModel mapping
  engine.ts       # generatePageLayouts / generatePageLayoutForPage
  ordering.ts     # Section ordering rules by page type
  responsive.ts   # Desktop/tablet/mobile render hints
  spacing.ts      # Spacing scale and section spacing rules
  alignment.ts    # Alignment, width, container rules
  fallback.ts     # Safe defaults/fallback handling
  metadata.ts     # Layout metadata and style hooks
  validation.ts   # Validation wrapper and fallback recovery
  overrides.ts    # Typed customization and override support
  performance.ts  # Lightweight cache to avoid recomputation
  fixtures/*      # Use-case fixtures
  index.ts        # Barrel export

components/generated-site/
  layout-renderer.tsx      # Layout metadata hooks for frontend
  page-layout-renderer.tsx # Layout-aware page rendering
  section-layout-shell.tsx # Section shell exposing layout hints
```

## Layout model

`WebsiteLayoutModel` contains:

- `structureId`, `websiteType`, `generatedAt`, `version`
- `pages: PageLayoutModel[]`

Each `PageLayoutModel` contains:

- selected `templateName`
- ordered `sectionLayouts`
- `hierarchy` (currently section-node list, group-ready)
- `responsiveDefaults`
- `metadata` (theme mode, style tag, spacing scale, emphasis pattern, typography mood, color strategy)

Each `SectionLayoutNode` contains:

- section identity (`sectionId`, `sectionType`, `pageId`, `pageSlug`)
- `slot`, `order`, `visible`
- responsive hints (`desktop/tablet/mobile`)
- spacing/alignment rules
- renderer style hook metadata

## Templates and variants

Defined variants:

- `hero-first`
- `content-heavy`
- `minimal`
- `grid-based`
- `services-first`
- `contact-focused`

Templates include supported website/page types, default section slot mapping, default section order, and rationale.

## Mapping and generation

`mapStructureToLayout()` maps Story 3-2 `WebsiteStructure` pages/sections into layout pages/nodes.

`generatePageLayouts()` orchestrates:

1. override sanitization
2. template selection
3. ordering rules
4. responsive/spacing/alignment application
5. metadata generation
6. validation + fallback recovery
7. cache write

`generatePageLayoutForPage()` returns one page layout by slug.

## Ordering rules

`ordering.ts` defines deterministic rules by page type:

- Home: hero → about/features → services → testimonials → cta → contact → footer
- About: hero/about → testimonials → cta/footer
- Services: hero → services → proof/testimonials → cta → contact/footer
- Contact: contact-first → supporting sections → footer

Custom section ordering by IDs is supported via overrides.

## Responsive rules

`responsive.ts` returns render hints (not raw CSS):

- columns
- stack behavior
- spacing scale
- alignment mode
- hero layout mode

Hints are generated per section for desktop/tablet/mobile.

## Spacing and alignment rules

`spacing.ts` provides spacing scale handling (`compact`, `comfortable`, `spacious`) and per-section padding/margin conventions.

`alignment.ts` provides alignment mode, width constraints, and container variants per section type with safe normalization.

## Fallbacks and defaults

`fallback.ts` ensures safe defaults when layout data is incomplete:

- default template variant
- default spacing scale
- fallback section node
- page-level default recovery

## Metadata and styling hooks

`metadata.ts` produces render hints:

- `themeMode`
- `layoutStyleTag`
- `spacingScale`
- `emphasisPattern`
- `typographyMood`
- `colorStrategy`

Section metadata includes `styleHook` and carries structure style hints.

## Validation

`schemas.ts` validates template names, page/section required fields, and responsive/alignment/spacing presence.

`validation.ts` wraps validation and applies default recovery on invalid output.

## Overrides/customization

`overrides.ts` supports typed overrides for:

- page template by slug
- section order by page slug
- section visibility by section id
- spacing scale by page slug
- alignment by section id

Overrides are sanitized before use.

## Frontend integration

- `lib/ai/structure/generator.ts` now generates and attaches `structure.layout`
- `components/generated-site/renderer.tsx` consumes layout metadata and page layout
- `PageRenderer` delegates to `PageLayoutRenderer`
- `SectionLayoutShell` exposes section-level layout hints through classes/data attributes

Rendering remains layered on the existing Story 3-2 renderer pipeline.

## Performance

`performance.ts` adds a lightweight in-memory cache keyed by `structure.id`, `structure.updatedAt`, and overrides JSON, with bounded size to avoid unbounded growth.

## Fixtures

`lib/ai/layout/fixtures/*` includes:

- portfolio
- small business
- landing page
- personal brand
- edge cases

Fixtures are generated from existing Story 3-2 structure fixtures via the layout engine to keep systems aligned and non-duplicated.
