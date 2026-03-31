# Website Prompt Design (ZLAP-STORY 3-1)

## 1) Scope, product boundary, and use cases

This story implements a **prompt-system design foundation** for Zero Labs AI Publisher (Layer 1 product app), not a full generation engine.

### MVP website types
- Portfolio
- Small business site
- Landing page
- Personal brand site

### Primary use cases
- Convert structured user input into website-ready copy blocks.
- Produce machine-readable output contracts that frontend components can render later.
- Support both one-shot generation and section-by-section generation workflows.

### MVP boundaries
- Includes prompt templates, schemas, variable injection, fixtures, workflow definition, and evaluation rubric.
- Excludes live AI provider orchestration and runtime website publishing engine.
- Stays decoupled from auth/session/profile/observability logic.

## 2) Input schema

Defined in `lib/ai/prompts/types.ts` and validated/sanitized in `lib/ai/prompts/schemas.ts`.

Required:
- `websiteType`
- `brandName`
- `description`
- `targetAudience`
- `tone`
- `style`
- `primaryCta`
- `services` (at least one)

Optional:
- `founderProfile`
- `testimonials`
- `contactInfo`
- `constraints`
- `customToneNotes`
- `customStyleNotes`

## 3) Output contract

Defined as `WebsiteGenerationOutput` in `lib/ai/prompts/types.ts` and example JSON contract in `lib/ai/prompts/schemas.ts`.

Contract includes:
- top-level metadata (`websiteType`, `siteTitle`, `tagline`)
- structured sections (`hero`, `about`, `services`, `testimonials`, `cta`, `contact`, `footer`)
- SEO fields (`title`, `description`, `keywords`)
- style hints (`tone`, `style`, color/typography mood)

## 4) Prompt architecture

### Core prompt
- `lib/ai/prompts/templates/core-website.ts`
- Handles framing, context, structure rules, output contract, and JSON-only return rule.

### Section prompts
- `section-hero.ts`
- `section-about.ts`
- `section-services.ts`
- `section-testimonials.ts`
- `section-cta.ts`
- `section-contact.ts`
- `section-footer.ts`

Section prompts are modular and can be run independently or as part of multi-step generation.

## 5) Tone/style guidelines

Defined in `lib/ai/prompts/variables.ts`:
- Tone presets: professional, casual, premium, friendly, bold, custom
- Style presets: minimalist, modern, corporate, editorial, playful, custom
- Shared readability rules for clarity and consistency

## 6) Variable injection and assembly

`lib/ai/prompts/index.ts` exposes:
- `buildWebsitePrompt(input, options)`
- `buildSectionPrompt(section, input)`
- `buildPromptBundle(input, options)`

These functions:
- sanitize inputs before prompt assembly
- validate required fields
- inject only relevant variables
- keep prompt formatting predictable

## 7) Guardrails and constraints

Defined in `lib/ai/prompts/guardrails.ts` and applied in prompt assembly.

Guardrails include:
- no fabricated facts
- no fabricated testimonials
- section scope discipline
- safety/off-brand protection
- concise and non-placeholder writing
- strict machine-readable output behavior

## 8) Token-efficiency approach

Token optimization is achieved by:
- centralizing repeated rules in reusable constants
- keeping section templates compact and single-purpose
- composing prompts from small modules rather than duplicating instruction blocks

## 9) Multi-step workflow

Defined in `lib/ai/prompts/workflow.ts`:
1. Outline generation
2. Section content generation
3. Output normalization to final schema

## 10) Integration readiness

Prompt modules are:
- typed
- app-owned under `lib/ai/prompts`
- UI-agnostic
- importable by future AI service wrappers without coupling to auth/profile/session modules

## 11) Evaluation criteria

Evaluation rubric in `lib/ai/prompts/evaluation.ts` scores:
- structure adherence
- relevance
- tone alignment
- readability
- completeness
- hallucination avoidance
- frontend renderability

## 12) How to extend

- Add a new section type in `types.ts`
- Add section template under `templates/`
- Wire section builder in `index.ts`
- Add fixture coverage under `fixtures/`
- Update evaluation/tests docs if constraints change
