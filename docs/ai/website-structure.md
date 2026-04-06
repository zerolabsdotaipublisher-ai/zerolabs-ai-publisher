# Website Structure Generation (ZLAP-STORY 3-2)

## Overview

This document describes the website structure generation system implemented in Story 3-2. It extends the prompt system from Story 3-1 to add a typed, validated, storable website structure model and a full generation pipeline.

Story 3-3 adds a dedicated page layout engine layered on top of this structure model. See `docs/ai/website-layout-generation.md` for the layout system details.

## Architecture

```
lib/ai/prompts/          ← Story 3-1: prompt contracts, templates, fixtures
lib/ai/structure/        ← Story 3-2: structure model, generation, storage
  types.ts               ← WebsiteStructure and all related types
  schemas.ts             ← Validation helpers (no external dep)
  templates.ts           ← Default section order and taglines per website type
  fallback.ts            ← Fallback defaults for incomplete AI output
  navigation.ts          ← Navigation structure generation
  metadata.ts            ← SEO metadata generation
  mapper.ts              ← AI output → WebsiteStructure transformation
  validation.ts          ← Render-readiness checks
  generator.ts           ← Main generation service (prompt → OpenAI → structure)
  regeneration.ts        ← Re-generation and version increment
  storage.ts             ← Supabase CRUD (website_structures table)
  index.ts               ← Barrel export
  fixtures/              ← Typed structure fixtures for all website types

components/generated-site/
  renderer.tsx           ← Top-level site renderer (nav + page)
  page-renderer.tsx      ← Page renderer (sections in order)
  section-renderer.tsx   ← Section dispatcher (hero/about/services/…)
  component-renderer.tsx ← Component renderer (MVP foundation)

app/(app)/generated-sites/[id]/page.tsx   ← View page for a generated site
app/api/ai/generate-structure/route.ts    ← POST: generate and store structure
app/api/ai/regenerate-structure/route.ts  ← POST: regenerate existing structure

supabase/migrations/20260401000000_website_structures.sql  ← DB migration
```

## Data model

### WebsiteStructure

The core model is `WebsiteStructure` (in `lib/ai/structure/types.ts`):

```typescript
interface WebsiteStructure {
  id: string;                     // "ws_<ts>_<rnd>"
  userId: string;                 // auth.users.id
  websiteType: WebsiteType;       // portfolio | small-business | landing-page | personal-brand
  siteTitle: string;
  tagline: string;
  pages: WebsitePage[];           // multi-page ready (MVP = 1 page)
  navigation: WebsiteNavigation;  // primary + footer nav
  seo: WebsiteSeo;                // title, description, keywords, ogImage?
  styleConfig: WebsiteStyleConfig;// tone, style, colorMood, typographyMood
  contentVariations?: ContentVariation[];  // A/B variants (optional)
  sourceInput: WebsiteGenerationInput;     // original prompt input
  status: WebsiteStructureStatus; // draft | published | archived
  version: number;                // incremented on each regeneration
  generatedAt: string;            // ISO 8601
  updatedAt: string;              // ISO 8601
}
```

### Relationship to Story 3-1

Story 3-1 produced `WebsiteGenerationOutput` — the AI output contract. Story 3-2 maps this to `WebsiteStructure`:

```
WebsiteGenerationInput
  → buildWebsitePrompt() (Story 3-1)
  → OpenAI API
  → WebsiteGenerationOutput (Story 3-1 output contract)
  → applyFallbacks()
  → mapOutputToStructure()
  → WebsiteStructure (Story 3-2)
  → generatePageLayouts() (Story 3-3)
  → structure.layout attached
  → storeWebsiteStructure() (Supabase)
  → Renderer components (layout-aware)
```

## Generation pipeline

### 1. Build prompt

The generator calls `buildWebsitePrompt(input)` from `lib/ai/prompts` (Story 3-1). No duplication — the prompt system is reused directly.

### 2. Call OpenAI

The generator calls the OpenAI Chat Completions endpoint via native `fetch`. Configuration comes from `config.services.openai` — never `process.env` directly.

```typescript
import { config } from "@/config";

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  headers: { Authorization: `Bearer ${config.services.openai.apiKey}` },
  body: JSON.stringify({ model: config.services.openai.model, ... }),
});
```

### 3. Parse response

The parser handles both bare JSON and markdown-fenced JSON blocks (some model outputs wrap JSON in ` ```json ``` `).

### 4. Apply fallbacks

`applyFallbacks()` fills in any fields absent from the AI response. Every field has a safe default so the structure is always renderable even if the AI returns nothing useful.

### 5. Map to structure

`mapOutputToStructure()` converts the AI output to a `WebsiteStructure` with:
- Sections extracted in canonical order
- Navigation derived from visible sections
- Page-level and site-level SEO generated
- Style config mapped from AI styleHints

### 6. Validate and store

`validateWebsiteStructure()` returns validation errors (non-blocking — the structure is returned even with errors). `storeWebsiteStructure()` persists to Supabase.

## Multi-page support

The `WebsitePage` model and `WebsiteStructure.pages` array are designed for multi-page sites. The MVP generates a single home page. To add more pages:

1. Add page-type inputs to `WebsiteGenerationInput` (extend Story 3-1 types)
2. Call the generation pipeline for each page
3. Add each `WebsitePage` to the `pages` array
4. The renderer already handles `pageSlug` routing via `<Renderer pageSlug="/about" />`

## Section-level structure

Each section has:
- `type` — drives renderer selection
- `content` — `Record<string, unknown>` matching the prompt output shape
- `order` — sort order for rendering
- `visible` — show/hide toggle
- `components?` — optional component-level structure (MVP foundation)

## Component-level structure (MVP foundation)

`WebsiteComponent` and `ComponentRenderer` are defined but not yet populated by the generation pipeline. They provide the foundation for future:
- In-editor component-level editing
- Custom component injection
- Component-level A/B testing via `ContentVariation`

## Default templates

`lib/ai/structure/templates.ts` defines per-website-type defaults:
- Default section ordering
- Fallback tagline
- Default primary navigation labels

## Navigation generation

`generateNavigation()` derives nav from visible sections:
- Excludes `hero`, `cta`, `footer` from primary nav
- Maps section type to human-readable label and anchor href
- Falls back to template defaults when no navigable sections are present
- Adds "Home" link and copyright notice to footer nav

## SEO metadata

`generateSiteSeo()` maps AI output SEO to `WebsiteSeo`.
`generatePageSeo()` creates page-specific overrides for non-home pages.

## Dynamic content variations

`ContentVariation` supports A/B testing per field:

```typescript
interface ContentVariation {
  sectionId: string;      // which section
  fieldPath: string;      // e.g. "content.headline"
  variants: string[];     // all possible values
  activeVariant: number;  // index of the active one
}
```

Not yet populated by the generation pipeline — foundation is in place.

## Fallbacks

`applyFallbacks()` fills in absent fields:
- Site title → brand name
- Tagline → template default
- Sections → safe generic copy
- SEO → derived from brand name and template tagline
- Style hints → "professional" / "modern" defaults

## Validation

### Input validation
`validateWebsiteGenerationInput()` from `lib/ai/prompts/schemas` — applied in the API route before calling the generator.

### Structure validation
`validateWebsiteStructure()` from `lib/ai/structure/schemas` — applied post-generation. Returns a list of errors. The structure is still returned even with errors so the API can surface partial results.

### Render-readiness check
`hasMinimumRenderableStructure()` checks for the minimum fields required by the renderer (hero headline + primaryCta). Used to decide whether a fallback warning should be shown.

## Storage

The `public.website_structures` table (migration `20260401000000_website_structures.sql`):

```sql
id            text        primary key       -- "ws_..." app-generated
user_id       uuid        references auth.users
website_type  text
site_title    text
tagline       text
structure     jsonb       -- full WebsiteStructure
source_input  jsonb       -- original WebsiteGenerationInput
status        text        default 'draft'
version       integer     default 1
generated_at  timestamptz
updated_at    timestamptz -- auto-updated by trigger
```

RLS is enabled; users can only read, write, and delete their own structures. The application also applies explicit `eq("user_id", userId)` filters on all queries as a defence-in-depth measure.

## API endpoints

### POST /api/ai/generate-structure

**Request body:** `WebsiteGenerationInput`

**Response (200):**
```json
{
  "structure":        { ... WebsiteStructure ... },
  "usedFallback":     false,
  "validationErrors": []
}
```

**Error responses:**
- `401` — not authenticated
- `400` — invalid JSON body
- `422` — input validation failed (with `details` array)
- `500` — generation or storage error

### POST /api/ai/regenerate-structure

**Request body:**
```json
{
  "structureId":  "ws_...",
  "updatedInput": { /* optional Partial<WebsiteGenerationInput> */ }
}
```

**Response (200):** same shape as generate-structure

**Error responses:**
- `401` — not authenticated
- `400` — missing or invalid JSON body
- `404` — structure not found or not owned by user
- `500` — regeneration or storage error

## Frontend rendering

### View page: /generated-sites/[id]

The `app/(app)/generated-sites/[id]/page.tsx` Server Component:
1. Gets the authenticated user from session
2. Fetches the structure from Supabase (scoped to user)
3. Passes it to `<Renderer />`

### Renderer components

```
<Renderer structure={...} pageSlug="/" />
  └── <PageRenderer page={...} />
        └── <SectionRenderer section={...} />   × N sections
              └── Hero / About / Services / … sub-renderers
```

`<ComponentRenderer />` is available for component-level rendering when `section.components` is populated.

## Regeneration

`regenerateWebsiteStructure(existing, userId, updatedInput?)`:
1. Merges `updatedInput` overrides onto `existing.sourceInput`
2. Calls `generateWebsiteStructure` with the merged input
3. Copies `id` and `generatedAt` from the existing structure
4. Increments `version`
5. Sets `updatedAt` to now

## Fixtures

`lib/ai/structure/fixtures/` provides typed `WebsiteStructure` objects for all four website types plus an edge-case fixture:

| File               | Website type    | Notable characteristics               |
|--------------------|-----------------|---------------------------------------|
| `portfolio.ts`     | portfolio       | premium/editorial, no testimonials    |
| `business-site.ts` | small-business  | all 7 sections, testimonials present  |
| `landing-page.ts`  | landing-page    | 5 sections, no about/contact          |
| `personal-brand.ts`| personal-brand  | 6 sections, 1:1 coaching              |
| `edge-cases.ts`    | landing-page    | custom tone/style, fallback content   |

## Task coverage

| Task | Deliverable | Location |
|------|-------------|----------|
| 1  | Define website structure model | `lib/ai/structure/types.ts` |
| 2  | Map AI output to website structure | `lib/ai/structure/mapper.ts` |
| 3  | Implement website structure generation service | `lib/ai/structure/generator.ts` |
| 4  | Implement multi-page support | `WebsitePage[]` in `types.ts`, `PageRenderer` |
| 5  | Implement section-level structure generation | `WebsiteSection` in `types.ts`, `SectionRenderer` |
| 6  | Implement component-level structure (MVP foundation) | `WebsiteComponent` in `types.ts`, `ComponentRenderer` |
| 7  | Implement default templates and fallbacks | `templates.ts`, `fallback.ts` |
| 8  | Implement navigation structure generation | `navigation.ts` |
| 9  | Implement metadata and SEO structure | `metadata.ts` |
| 10 | Handle dynamic content variations | `ContentVariation` in `types.ts` |
| 11 | Validate generated website structure | `schemas.ts`, `validation.ts` |
| 12 | Store generated website structure | `storage.ts`, migration SQL |
| 13 | Implement regeneration and update logic | `regeneration.ts`, `POST /api/ai/regenerate-structure` |
| 14 | Integrate structure generation with frontend rendering | `app/(app)/generated-sites/[id]/page.tsx`, all renderer components |
| 15 | Test website structure generation across use cases | `fixtures/` (portfolio, business, landing, personal, edge) |
| 16 | Document website structure generation system | This file |
