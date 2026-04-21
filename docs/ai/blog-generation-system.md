# AI Blog Generation System

This story adds a product-owned AI blog workflow to Zero Labs AI Publisher.

## Architecture

- Blog generation logic lives in `lib/blog/*`
- AI calls use the app configuration in `@/config`
- Blog storage uses Supabase (`public.blog_posts` + `public.website_structures`)
- Website preview, routing, editor save, publish flow, and versioning reuse the existing product pipeline
- ZeroFlow remains optional platform infrastructure only and is not used for blog logic

## Core flow

1. `POST /api/blog/generate` accepts structured blog input
2. `lib/blog/generation.ts` builds prompts, requests structured JSON, applies fallback content when needed, and validates the result
3. Blog content is mapped into `WebsiteStructure` pages for:
   - `/` blog listing page
   - `/{slug}` article page
4. The structure is stored in `website_structures`
5. Structured blog data is stored in `blog_posts`
6. Existing preview, editor save, routing, SEO artifact persistence, publish workflow, and versioning keep working on the generated structure

## Editing and regeneration

- `POST /api/blog/save` persists edited structured blog content and re-maps it into `WebsiteStructure`
- `POST /api/blog/regenerate` supports:
  - full post regeneration
  - section-only regeneration
- `POST /api/blog/preview` returns preview metadata for the generated structure/page

## Quality and SEO controls

- Input sanitization and validation live in `lib/blog/validation.ts`
- Prompt templates enforce JSON-only responses and content guardrails
- SEO helpers normalize:
  - slug
  - meta title
  - meta description
  - tags
  - H1/H2/H3 outline
- Quality checks flag filler phrases, missing metadata, and thin sections

## Token and performance considerations

- Generation uses a single structured JSON response for the full article
- Section regeneration uses a smaller scoped prompt
- Length presets drive section count and target word count to keep requests bounded

## File map

- `lib/blog/types.ts` — blog domain types
- `lib/blog/schema.ts` — blog output contract example
- `lib/blog/prompts.ts` — reusable prompt templates
- `lib/blog/seo.ts` — SEO and sizing helpers
- `lib/blog/validation.ts` — input/output guardrails
- `lib/blog/generation.ts` — AI generation, fallback, mapping to `WebsiteStructure`
- `lib/blog/storage.ts` — Supabase persistence
- `lib/blog/scenarios.ts` — test scenario definitions
- `app/api/blog/*` — API surface for generate, regenerate, save, preview
- `components/generated-site/section-renderer.tsx` — blog rendering in generated websites
