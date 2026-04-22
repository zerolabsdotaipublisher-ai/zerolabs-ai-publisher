# AI Article Generation System

This document defines the MVP implementation for ZLAP-STORY 6-2: AI Article Generation.

## Architecture

- Article generation logic lives in `lib/article/*` and remains product-owned inside AI Publisher.
- ZeroFlow is not used for article prompts, article schema, article storage, article metadata, or article regeneration behavior.
- Articles reuse the existing website structure, preview, routing, versioning, artifact persistence, and publish pipeline.
- Generated article content is stored in Supabase using `public.article_posts` plus the existing `website_structures` and `website_generated_content` tables.
- Article pages stay compatible with the current generated-site renderer and deployable website system.

## Supported MVP scope

### Article types

- `long-form-article`
- `guide`
- `thought-leadership`
- `news-style`

### Editorial controls

- tone: reuse existing tone presets
- style: reuse existing style presets
- depth: `overview`, `strategic`, `expert`
- length: `short`, `medium`, `long`, `extended`
- inputs: topic, keywords, target audience, optional summary, optional outline, optional user context, optional references, optional scheduling timestamp

### Structure expectations

Each generated article returns structured data with:

- title
- subtitle
- excerpt
- introduction
- sections
- conclusion
- call to action
- SEO metadata
- editorial metadata
- optional typed references

Sections use H2-equivalent headings, optional H3 headings, summary text, body paragraphs, and optional takeaways.

## SEO and content strategy

- Use one H1 article title with a clear subtitle.
- Maintain H1 → H2 → optional H3 heading hierarchy.
- Align the focus keyword with title, introduction, at least one H2, and meta title.
- Keep meta title concise and meta description search-friendly.
- Prefer useful, specific language over generic filler.
- Keep tags deduplicated and short enough for UI display.
- Preserve readability and predictable section count to support preview, editing, and publishing.

## Prompt and generation workflow

1. `POST /api/article/generate` accepts a typed article brief.
2. `lib/article/generation.ts` sanitizes the input, builds prompts, requests structured JSON from OpenAI, and falls back to product-owned scaffolding if needed.
3. The generated article is normalized and validated.
4. `mapArticleToWebsiteStructure()` maps the article into:
   - `/` article index page
   - `/{slug}` article page
5. The structure is stored in `website_structures`.
6. The structured article is stored in `article_posts`.
7. Generated content artifacts are serialized into `website_generated_content`.
8. Existing preview, editor save, draft versioning, and publish flows operate on the mapped website structure.

## Editing and regeneration

- `POST /api/article/save` persists human edits to the structured article and re-maps the result into `WebsiteStructure`.
- `POST /api/article/regenerate` supports:
  - full-article regeneration
  - section-only regeneration
- `POST /api/article/preview` and `GET /api/article/preview` return preview metadata for the owner preview shell.
- Draft saves continue using `saveEditorStructureDraft()` so version snapshots and artifact persistence remain consistent.

## Storage model

- `public.article_posts`
  - product-owned article table
  - stores `article_json`, `source_input`, `article_type`, version, and scheduling/publish timestamps
  - protected by RLS on `user_id`
- `public.website_structures`
  - stores the routeable website structure used by preview and publishing
- `public.website_generated_content`
  - stores reusable page and section content artifacts aligned with the existing content system

## Performance and cost boundaries

- The default flow uses one structured JSON generation request for the full article.
- Section regeneration narrows scope to a single section.
- Length presets map to predictable section counts and word-count targets.
- Outline-first generation reduces drift and unnecessary retries.
- Optional references stay metadata-driven and do not introduce a separate research workflow.

## MVP boundaries

This story intentionally does **not** implement:

- a full editorial scheduling platform
- autonomous research or citation crawling workflows
- a second disconnected article content subsystem
- article ownership in ZeroFlow
- raw `process.env` access outside the existing config layer

## Validation and compatibility checklist

- article logic remains outside `services/zeroflow`
- article content remains product-owned
- article pages remain compatible with `WebsiteStructure`
- preview, routing, versioning, and publishing reuse existing product infrastructure
- article content stays renderable by the generated-site renderer

## Story task to file mapping

1. Define Article Generation Requirements — `docs/ai/article-generation-system.md`, `lib/article/types.ts`, `lib/article/scenarios.ts`
2. Define Article Content Schema — `lib/article/types.ts`, `lib/article/schema.ts`
3. Define Content Strategy and SEO Guidelines — `docs/ai/article-generation-system.md`, `lib/article/seo.ts`
4. Design AI Prompt Templates for Article Generation — `lib/article/prompts.ts`
5. Implement Article Generation Service — `lib/article/generation.ts`
6. Implement Topic, Outline, and Input Handling — `lib/article/types.ts`, `lib/article/validation.ts`, `app/api/article/generate/route.ts`
7. Generate Article Titles and Subheadings — `lib/article/generation.ts`, `lib/article/schema.ts`, `lib/article/seo.ts`
8. Generate Full-Length Article Content — `lib/article/generation.ts`
9. Implement Section-Level Content Generation — `lib/article/generation.ts`, `app/api/article/regenerate/route.ts`
10. Implement Tone, Depth, and Style Control — `lib/article/types.ts`, `lib/article/prompts.ts`, `lib/article/generation.ts`
11. Implement Content Length Control — `lib/article/types.ts`, `lib/article/seo.ts`, `lib/article/generation.ts`
12. Implement Content Quality Guardrails — `lib/article/prompts.ts`, `lib/article/validation.ts`
13. Implement Citation or Reference Support (Optional) — `lib/article/types.ts`, `lib/article/schema.ts`, `lib/article/generation.ts`, `components/generated-site/section-renderer.tsx`
14. Implement Fallback and Regeneration Logic — `lib/article/generation.ts`
15. Store Generated Article Content — `lib/article/storage.ts`, `supabase/migrations/20260422090000_article_posts.sql`
16. Integrate Articles with Website System — `lib/article/generation.ts`, `components/generated-site/section-renderer.tsx`, `lib/pipeline/ssg/validation.ts`, `lib/versions/snapshots.ts`
17. Implement Article Preview Functionality — `app/api/article/preview/route.ts`
18. Implement Article Editing and Regeneration Controls — `app/api/article/save/route.ts`, `app/api/article/regenerate/route.ts`, `lib/editor/storage.ts`
19. Optimize Article Generation Performance and Cost — `lib/article/prompts.ts`, `lib/article/seo.ts`, `lib/article/generation.ts`
20. Test Article Generation Across Scenarios — `lib/article/scenarios.ts`, `docs/ai/article-generation-tests.md`
21. Document AI Article Generation System — `docs/ai/article-generation-system.md`
