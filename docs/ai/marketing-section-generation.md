# Marketing Section Generation (ZLAP-STORY 6-4)

## Overview

Story 6-4 extends the existing website content pipeline so AI Publisher owns typed marketing-section generation without creating a second disconnected section engine.

Pipeline:

`prompt foundation -> website content generation -> marketing section normalization/guardrails -> WebsiteStructure mapping -> renderer/editor/save/preview/publish compatibility`

## Supported marketing sections

- hero
- features
- benefits
- testimonials / social proof
- CTA
- FAQ
- optional pricing / offer sections

## Supported variants

- hero: `text-only`, `with-image`
- features / benefits: `grid`, `list`
- testimonials / social proof: `single-quote`, `quote-grid`, `trust-strip`
- CTA: `banner`, `block`
- FAQ: `compact`, `expanded`
- pricing: `two-tier`, `three-tier`

## Product-owned schema

Marketing content remains stored as app-owned structured section data:

- section headline / subheadline / supporting copy
- bullets, paragraphs, and structured items
- CTA labels and href targets
- hero image placeholder metadata
- testimonial author / company / placeholder flags
- FAQ entries
- pricing tiers, guarantees, and disclaimers
- variant, audience, tone, density, and goal metadata

Primary files:

- `lib/ai/content/types.ts`
- `lib/ai/content/section-types.ts`
- `lib/ai/content/schemas.ts`
- `lib/ai/content/pricing.ts`

## Generation behavior

The marketing generator reuses the existing Story 3-4 content service and adds:

- audience override and conversion-goal prompt guidance
- per-section variant guidance
- structured marketing section normalization
- pricing support
- targeted regeneration by section type or editor section id
- partial section regeneration without overwriting unrelated sections

Primary files:

- `lib/ai/content/prompts.ts`
- `lib/ai/content/service.ts`
- `lib/ai/content/fallback.ts`
- `lib/ai/content/guardrails.ts`
- `lib/ai/content/validation.ts`
- `app/api/marketing/generate/route.ts`
- `app/api/marketing/regenerate/route.ts`

## Renderer, editor, storage, and preview integration

- `WebsiteStructure` now supports `features`, `benefits`, `faq`, and `pricing` section types
- generated sections are inserted into the existing structure when needed
- layout ordering and template slots include the new marketing sections
- generated-site rendering supports hero metadata, feature/benefit lists, FAQ blocks, and pricing tiers
- editor section controls can add/remove/reorder the new section types
- generated marketing content is stored in `website_generated_content`
- manual section edits can be saved back into product-owned structure and content snapshots

Primary files:

- `lib/ai/structure/types.ts`
- `lib/ai/content/mapper.ts`
- `lib/ai/content/storage.ts`
- `components/generated-site/section-renderer.tsx`
- `components/editor/editor-section-selector.tsx`
- `lib/editor/sections.ts`
- `lib/ai/layout/templates.ts`
- `lib/ai/layout/ordering.ts`
- `lib/ai/layout/alignment.ts`
- `lib/ai/layout/responsive.ts`
- `app/api/marketing/preview/route.ts`
- `app/api/marketing/save/route.ts`

## MVP boundaries

- Reuses the current WebsiteStructure, layout, preview, versioning, and publish flows
- Does not move marketing logic into `services/zeroflow`
- Does not add a full CMS or design system
- Does not add analytics or personalization systems
- Keeps pricing as safe placeholder packaging unless explicit commercial input exists

## Task-to-file mapping

1. Requirements: `docs/ai/marketing-section-generation.md`
2. Marketing schema: `lib/ai/content/types.ts`, `lib/ai/content/schemas.ts`
3. Section types and variants: `lib/ai/content/section-types.ts`, `lib/ai/structure/types.ts`
4. Prompt templates: `lib/ai/content/prompts.ts`
5. Generation service: `lib/ai/content/service.ts`
6. Hero generation: `lib/ai/content/hero.ts`
7. Features and benefits: `lib/ai/content/informational.ts`, `components/generated-site/section-renderer.tsx`
8. Testimonials / social proof: `lib/ai/content/fallback.ts`, `lib/ai/content/service.ts`, `components/generated-site/section-renderer.tsx`
9. CTA sections: `lib/ai/content/cta.ts`, `components/generated-site/section-renderer.tsx`
10. Pricing / offers: `lib/ai/content/pricing.ts`, `components/generated-site/section-renderer.tsx`
11. FAQ sections: `lib/ai/content/service.ts`, `components/generated-site/section-renderer.tsx`
12. Tone and audience adaptation: `lib/ai/content/prompts.ts`, `lib/ai/content/types.ts`
13. Length and density control: `lib/ai/content/length.ts`, `lib/ai/content/types.ts`
14. Quality guardrails: `lib/ai/content/guardrails.ts`, `lib/ai/content/validation.ts`
15. Fallback and regeneration: `lib/ai/content/fallback.ts`, `lib/ai/content/regeneration.ts`, `app/api/marketing/regenerate/route.ts`
16. WebsiteStructure/layout integration: `lib/ai/content/mapper.ts`, `lib/ai/layout/templates.ts`, `lib/ai/layout/ordering.ts`
17. Storage and retrieval: `lib/ai/content/storage.ts`, `app/api/marketing/preview/route.ts`
18. Editing and customization controls: `lib/editor/sections.ts`, `components/editor/editor-section-selector.tsx`, `app/api/marketing/save/route.ts`
19. Scenario coverage: `docs/ai/marketing-section-tests.md`
20. System documentation: `docs/ai/marketing-section-generation.md`
