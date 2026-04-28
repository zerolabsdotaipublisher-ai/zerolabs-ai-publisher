# Social Post Generation System (ZLAP-STORY 7-2)

This document defines the MVP implementation for AI social media post generation.

## Architecture alignment

- Social generation logic lives in `lib/social/*` and remains owned by AI Publisher.
- Social metadata, platform rules, prompt contracts, and generated post storage stay in product-owned code and DB tables.
- ZeroFlow is intentionally excluded from social post domain ownership.
- Existing content systems (website/blog/article), scheduling-compatible status semantics, preview patterns, and generated content bundle retrieval are reused where practical.

## MVP scope

### Supported platforms

- Facebook
- Instagram
- X
- LinkedIn

### Supported post schema

Each platform variant includes:

- caption/text
- hashtags
- call-to-action
- optional link
- media references
- platform metadata (limits/support flags/coverage/warnings)

### Input support

- topic
- keywords
- campaign goal
- audience
- tone
- optional URL
- source content references (website/blog/article/custom)

## Generation and workflow

1. `POST /api/social/generate` sanitizes and validates input.
2. `lib/social/generation.ts` resolves source content context from existing generated website/blog/article data where available.
3. OpenAI returns structured social variants using prompt contracts and platform rules.
4. Validation + normalization applies platform-length optimization, hashtag limits, link support constraints, and quality guardrails.
5. Fallback variants are used if AI output is incomplete/invalid.
6. Results are persisted in `social_posts` for later edit/schedule/publish workflows.

## Preview and editing

- `GET|POST /api/social/preview` returns platform card previews from stored post variants.
- `POST /api/social/save` persists user edits for caption/hashtags/CTA/link/platform variant values.
- Components:
  - `components/social/social-post-preview.tsx`
  - `components/social/social-post-editor.tsx`

## Persistence model

- `public.social_posts` stores generated social posts, source input snapshot, lifecycle status, version metadata, regeneration count, and schedule/publish timestamps.
- `lib/content/storage.ts` includes social posts in generated content bundle retrieval and archive flows for shared structure contexts.

## Guardrails and fallback behavior

- Input validation ensures required topic/keywords/goal/audience and valid optional URL.
- Platform validation enforces character and hashtag limits plus link support constraints.
- Banned phrase checks reduce low-quality filler and AI-disclosure leakage.
- Automatic fallback produces complete variants per requested platform if AI output fails.
- Regeneration supports all-platform or single-platform updates with version bumping.

## Performance and cost choices

- Single prompt generates all platform variants from one input to reduce token use.
- Regeneration supports single-platform scope to reduce unnecessary full rewrites.
- Source content context is resolved from existing stored content to avoid duplicate prompts.
- Deterministic fallback keeps workflow resilient without extra retries.

## MVP boundaries

This story intentionally does **not** include:

- social account connection or OAuth
- direct publishing to platform APIs
- external social delivery workers/adapters
- platform credential/token management
- any social domain ownership under `services/zeroflow`

## Story task to file mapping (all 20 tasks)

1. Define Social Media Content Generation Requirements — `docs/social/social-post-generation.md`, `lib/social/types.ts`, `lib/social/scenarios.ts`
2. Define Social Post Content Schema — `lib/social/types.ts`, `lib/social/schema.ts`
3. Define Platform-Specific Content Rules — `lib/social/platform-rules.ts`, `lib/social/validation.ts`
4. Design AI Prompt Templates for Social Posts — `lib/social/prompts.ts`
5. Implement Social Post Generation Service — `lib/social/generation.ts`
6. Implement Topic and Content Input Handling — `lib/social/types.ts`, `lib/social/validation.ts`, `app/api/social/generate/route.ts`
7. Generate Platform-Specific Post Variants — `lib/social/generation.ts`, `lib/social/platform-rules.ts`
8. Generate Hashtags and Keyword Enhancements — `lib/social/generation.ts`, `lib/social/validation.ts`
9. Generate Call-to-Action Content — `lib/social/generation.ts`, `lib/social/prompts.ts`
10. Implement Tone and Audience Adaptation — `lib/social/types.ts`, `lib/social/prompts.ts`, `lib/social/generation.ts`
11. Implement Content Length Optimization — `lib/social/validation.ts`, `lib/social/platform-rules.ts`
12. Implement Content Quality Guardrails — `lib/social/validation.ts`, `lib/social/prompts.ts`
13. Implement Fallback and Regeneration Logic — `lib/social/generation.ts`, `app/api/social/regenerate/route.ts`
14. Integrate Social Post Generation with Content Systems — `lib/social/generation.ts`, `lib/content/storage.ts`, `lib/content/types.ts`
15. Store Generated Social Media Posts — `lib/social/storage.ts`, `supabase/migrations/20260428030000_social_posts.sql`
16. Implement Social Post Preview Functionality — `lib/social/preview.ts`, `app/api/social/preview/route.ts`, `components/social/social-post-preview.tsx`
17. Implement Editing and Customization Controls — `app/api/social/save/route.ts`, `components/social/social-post-editor.tsx`, `lib/social/validation.ts`
18. Test Social Media Post Generation Across Scenarios — `lib/social/scenarios.ts`, `docs/social/social-post-generation-tests.md`
19. Optimize Social Post Generation Performance and Cost — `lib/social/generation.ts`, `lib/social/prompts.ts`, `lib/social/validation.ts`
20. Document Social Media Post Generation System — `docs/social/social-post-generation.md`
