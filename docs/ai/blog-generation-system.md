# AI Blog Generation System

This story adds a product-owned AI blog workflow to Zero Labs AI Publisher.

## Architecture

- Blog generation logic lives in `lib/blog/*`
- AI calls use the app configuration in `@/config`
- Blog storage uses Supabase (`public.blog_posts`, `public.website_structures`, and `public.website_generated_content`)
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
6. Blog page and section content is also serialized into `website_generated_content`
7. Existing preview, editor save, routing, SEO artifact persistence, SSG/publish workflow, and versioning keep working on the generated structure

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

## Versioning, publishing, and scheduling

- Initial blog generation now creates a draft version snapshot in `website_versions`
- Blog save/regenerate operations reuse editor draft persistence, which already creates new version snapshots
- Version snapshots include blog summary metadata derived from the structure so blog changes remain compatible with `lib/versions/*`
- Basic scheduling support is stored on the blog record with `scheduled_publish_at` / `publishAt`
- The existing website publish pipeline remains the deployment path; blogs are deployable because they are embedded in `WebsiteStructure` and validated by the SSG layer

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
- `lib/blog/storage.ts` — Supabase persistence plus `website_generated_content` serialization
- `lib/blog/scenarios.ts` — test scenario definitions
- `app/api/blog/*` — API surface for generate, regenerate, save, preview
- `components/generated-site/section-renderer.tsx` — blog rendering in generated websites
- `lib/editor/storage.ts` — draft persistence and version snapshot creation reused by blog save/regenerate
- `lib/versions/{types,snapshots,model}.ts` — version snapshot metadata updated for blog-aware summaries
- `lib/pipeline/ssg/validation.ts` — blog structure validation for deployable static output
- `supabase/migrations/20260421161000_blog_posts.sql` — blog storage schema and scheduling fields

## Story 6-1 task mapping

1. Define blog generation requirements — `lib/blog/types.ts`, `lib/blog/scenarios.ts`
2. Define blog schema — `lib/blog/types.ts`, `lib/blog/schema.ts`
3. Define SEO strategy — `lib/blog/seo.ts`, `docs/ai/blog-generation-system.md`
4. Create reusable AI prompt templates — `lib/blog/prompts.ts`
5. Implement blog generation service — `lib/blog/generation.ts`
6. Implement topic + keyword input handling — `lib/blog/validation.ts`, `app/api/blog/generate/route.ts`
7. Generate titles and headings — `lib/blog/generation.ts`, `lib/blog/seo.ts`
8. Generate full structured blog content — `lib/blog/generation.ts`
9. Support section-level generation — `lib/blog/generation.ts`, `app/api/blog/regenerate/route.ts`
10. Generate SEO metadata — `lib/blog/seo.ts`, `lib/blog/generation.ts`, `lib/editor/storage.ts`
11. Implement tone + length control — `lib/blog/types.ts`, `lib/blog/seo.ts`, `lib/blog/prompts.ts`
12. Add content quality guardrails — `lib/blog/validation.ts`, `lib/blog/prompts.ts`
13. Implement fallback + regeneration logic — `lib/blog/generation.ts`
14. Store blog content in database — `lib/blog/storage.ts`, `supabase/migrations/20260421161000_blog_posts.sql`
15. Integrate blogs with website builder/routing/structure — `lib/blog/generation.ts`, `components/generated-site/section-renderer.tsx`
16. Implement blog preview functionality — `app/api/blog/preview/route.ts`
17. Implement blog editing + regeneration controls — `app/api/blog/save/route.ts`, `app/api/blog/regenerate/route.ts`, `lib/editor/storage.ts`
18. Test blog generation scenarios — `lib/blog/scenarios.ts`
19. Optimize performance + token usage — `lib/blog/prompts.ts`, `lib/blog/seo.ts`
20. Document blog generation system — `docs/ai/blog-generation-system.md`
