# Website Content Generation (ZLAP-STORY 3-4)

## Overview

Story 3-4 adds an app-owned, typed content generation layer on top of:

- Story 3-1 prompt system (`lib/ai/prompts`)
- Story 3-2 website structure pipeline (`lib/ai/structure`)
- Story 3-3 page layout engine (`lib/ai/layout`)

Pipeline:

`prompt foundation -> content generation -> content validation/guardrails -> structure mapping -> layout refresh -> renderer`

No parallel prompt system is introduced. Story 3-4 composes existing prompt foundations and keeps product-specific copy logic in AI Publisher (Layer 1).

## Requirements and scope

### Supported content types

- Headlines and subheadlines
- Supporting paragraphs and bullets
- Hero copy
- Informational copy (about, services, features, process, benefits)
- CTA and conversion copy
- Supporting microcopy (button labels, trust indicators, helper text, descriptors)
- FAQ blocks
- Testimonials (real or explicit placeholders)
- Contact and footer messaging
- Page-level value proposition messaging

### Supported website/page categories

- Website types: portfolio, small-business, landing-page, personal-brand
- Multi-page generation support for: `/`, `/about`, `/services`, `/contact`
- Existing structure pages are always generated first; default pages are appended for content completeness.

### Tone and style support

- Tone: professional, casual, premium, friendly, bold, custom
- Style: minimalist, modern, corporate, editorial, playful, custom
- Length presets: concise, balanced, detailed
- Density presets: light, medium, high

### Output contract expectations

- Strict JSON output with typed page + section content map
- Section contracts defined in `lib/ai/content/section-types.ts`
- Render-compatible mapping into existing Story 3-2 section shapes
- Storage-compatible row model for section-level persistence

### MVP boundaries

- Includes generation, validation, guardrails, fallback, regeneration, mapping, persistence, and API integration
- Excludes full WYSIWYG or manual editor workflow
- Excludes platform-layer ownership (remains product app logic)

## Architecture

```
lib/ai/content/
  types.ts
  schemas.ts
  section-types.ts
  prompts.ts
  service.ts
  hero.ts
  informational.ts
  cta.ts
  microcopy.ts
  tone.ts
  length.ts
  guardrails.ts
  fallback.ts
  regeneration.ts
  mapper.ts
  validation.ts
  storage.ts
  evaluation.ts
  fixtures/*
  index.ts

app/api/ai/generate-content/route.ts
app/api/ai/regenerate-content/route.ts

supabase/migrations/20260407000000_website_generated_content.sql
```

## Prompt usage

`lib/ai/content/prompts.ts` composes:

- `buildPromptBundle(...)` from Story 3-1
- Story 3-1 tone/style guidance utilities
- Story 3-1 guardrails plus content-specific guardrails
- Content output contract JSON

This keeps prompt strategy centralized while adding content-specific output requirements.

## Service flow

1. Resolve page generation contexts from structure (`resolvePageGenerationContexts`)
2. Build content prompt by composing Story 3-1 prompt foundation
3. Call OpenAI via config-governed native `fetch`
4. Parse and normalize structured JSON response
5. Validate schema, section contracts, and length/density constraints
6. Apply quality guardrails
7. Apply fallback package if generation is malformed/low quality
8. Map content to structure sections and refresh layout
9. Persist generated content rows and updated structure through app-owned storage

## Validation and guardrails

- Schema shape checks (`validateWebsiteContentShape`)
- Section contract + required field checks
- Length and density checks per section type
- Guardrail checks for unsupported claims and filler language
- Placeholder testimonial policy (`isPlaceholder=true` when synthetic)

## Storage model

`website_generated_content` table stores section/page content per structure:

- `id`
- `structure_id`
- `user_id`
- `page_slug`
- `section_key`
- `content_json`
- `generated_from_input`
- `version`
- `created_at`
- `updated_at`

All data remains product-app owned and scoped with RLS.

## Regeneration strategy

- Full or targeted regeneration via options
- Merges `updatedInput` with previous source input
- Re-runs generation with retries
- Falls back safely when invalid
- Updates structure version and timestamps

## Renderer integration

Generated content is mapped into existing structure section content fields (hero/about/services/testimonials/cta/contact/footer), then layout is regenerated (`generatePageLayouts`) to keep renderer compatibility.

## Extension guidance

To add new section support:

1. Add section type in `types.ts`
2. Add contract in `section-types.ts`
3. Add normalization/fallback rules
4. Add mapper handling to structure-compatible fields
5. Add fixture coverage and update test scenarios

## Task coverage

1. Requirements: this document (requirements/scope)
2. Content schema: `lib/ai/content/types.ts`, `lib/ai/content/schemas.ts`
3. Section content types: `lib/ai/content/section-types.ts`
4. Prompt templates: `lib/ai/content/prompts.ts`
5. Content service: `lib/ai/content/service.ts`
6. Hero generation: `lib/ai/content/hero.ts`
7. Informational generation: `lib/ai/content/informational.ts`
8. CTA generation: `lib/ai/content/cta.ts`
9. Microcopy generation: `lib/ai/content/microcopy.ts`
10. Tone/style adaptation: `lib/ai/content/tone.ts`
11. Length/density controls: `lib/ai/content/length.ts`
12. Guardrails: `lib/ai/content/guardrails.ts`
13. Fallback/regeneration: `lib/ai/content/fallback.ts`, `lib/ai/content/regeneration.ts`
14. Structure/layout mapping: `lib/ai/content/mapper.ts`
15. Multi-page support: `lib/ai/content/mapper.ts`, `lib/ai/content/service.ts`
16. Validation checks: `lib/ai/content/validation.ts`
17. Storage: `lib/ai/content/storage.ts`, migration SQL
18. Website-type tests/fixtures: `lib/ai/content/fixtures/*`, `docs/ai/website-content-tests.md`
19. Evaluation criteria: `lib/ai/content/evaluation.ts`
20. Architecture docs: this document
