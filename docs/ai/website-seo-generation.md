# Website SEO + Metadata Generation (ZLAP-STORY 3-6)

## Requirements and scope

Story 3-6 adds discoverability intelligence on top of Stories 3-1 through 3-5.

Scope in this story:

- App-owned SEO requirements and metadata schema for site and page metadata
- SEO strategy by page type (home/about/services/contact/custom)
- Prompt-driven metadata generation with token-efficient context
- Multi-page metadata generation (titles, descriptions, keywords)
- Open Graph metadata generation
- Canonical URL generation
- Validation and fallback recovery
- Metadata storage and retrieval in product-owned DB table
- Override support for site/page metadata
- Frontend integration through Next.js Metadata API
- Evaluation criteria for quality tracking

Out of scope:

- Full visual SEO editor UI
- Moving SEO ownership to ZeroFlow platform

## Architecture

SEO remains in Layer 1 (AI Publisher):

```
lib/ai/seo/
  types.ts
  requirements.ts
  schemas.ts
  strategy.ts
  prompts.ts
  service.ts
  titles.ts
  descriptions.ts
  og.ts
  canonical.ts
  fallback.ts
  validation.ts
  overrides.ts
  storage.ts
  evaluation.ts
  fixtures/*
  index.ts

app/api/ai/generate-seo/route.ts
app/api/ai/regenerate-seo/route.ts
supabase/migrations/20260408010000_website_seo_metadata.sql
```

No cross-layer coupling with ZeroFlow is introduced.

## Metadata schema

`WebsiteSeoPackage` stores:

- site metadata (`title`, `description`, `keywords`, canonical base, default OG)
- page metadata per slug (`title`, `description`, `keywords`, canonical, OG)
- generation metadata (`generatedFromInput`, version, timestamps)

This metadata is also projected back into the existing `WebsiteStructure` `seo` and `page.seo` fields.

## Generation strategy

Generation path:

`input + structure/content context -> SEO prompt -> AI response -> normalization -> validation -> fallback -> overrides -> storage`

Token optimization:

- prompt foundation reuses compact Story 3-1 prompt bundle
- only essential page context is sent (slug/type/title/top section headlines)
- sections per page are capped (`maxSectionsPerPage`)

## Integration points

- `generate-structure` + `regenerate-structure` now generate/store SEO metadata
- `generate-content` + `regenerate-content` now regenerate/store SEO metadata after content mapping
- Dedicated SEO APIs exist for isolated metadata generation/regeneration
- Generated site page uses Next.js `generateMetadata` to inject title/description/keywords/canonical/Open Graph

## Storage

`public.website_seo_metadata` stores site row (`__site__`) + page rows keyed by structure/version.

Persistence API:

- `storeWebsiteSeoMetadata`
- `getWebsiteSeoMetadata`

## Evaluation metrics

`WEBSITE_SEO_EVALUATION_CRITERIA` defines weighted metrics for:

- title quality
- description quality
- keyword relevance
- canonical validity
- Open Graph completeness
- page intent fit
- fallback recovery quality
