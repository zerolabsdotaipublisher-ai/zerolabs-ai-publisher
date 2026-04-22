# SEO Content Generation System (ZLAP-STORY 6-3)

## Scope and MVP boundaries

Supported content types:
- core website pages
- blog posts
- article pages

This story adds a unified, product-owned SEO optimization layer that stays inside AI Publisher.

Included in MVP:
- typed keyword strategy (`primaryKeyword`, `secondaryKeywords`, `targetAudience`, `searchIntent`)
- shared SEO metadata model reused by website, blog, and article flows
- keyword-aware prompt guidance for blog/article generation
- title/meta/heading/internal-link/readability/length/guardrail metadata
- future-ready lightweight scoring and performance metadata
- SEO preview and save APIs
- practical page-level SEO editing controls in the existing editor
- persistence through existing WebsiteStructure, content records, and `website_seo_metadata`

Explicitly out of scope in this story:
- full SEO analytics dashboards
- backlink research systems
- off-product SEO logic in ZeroFlow
- a second disconnected SEO engine

## Architecture

Ownership remains in Layer 1:
- `lib/seo/*` owns the shared SEO content schema, keyword strategy, guardrails, scoring, and storage helpers
- `lib/ai/seo/*` remains the website metadata generation layer and now enriches generated page/site metadata with shared SEO content metadata
- `lib/blog/*` and `lib/article/*` reuse the shared SEO layer instead of keeping isolated SEO models
- `app/api/seo/*` exposes unified generate/preview/save endpoints while existing blog/article/website flows remain intact

ZeroFlow boundary:
- no SEO prompts, keyword strategy, metadata semantics, or content-specific SEO logic were moved into `services/zeroflow`

## Workflow

1. Generation input accepts typed SEO keyword strategy.
2. Blog/article prompts receive shared SEO guidance.
3. Shared SEO generation produces deterministic optimization metadata.
4. Website/blog/article mapping projects SEO back into `WebsiteStructure` page SEO.
5. Existing preview, save, versioning, routing, and publish flows continue to operate on the same structures.
6. Unified SEO preview/save routes expose product-owned SEO editing without bypassing the pipeline.

## Schema summary

Primary shared type: `SeoContentMetadata`
- content type and slug
- title tag and meta description
- keyword strategy
- heading structure
- internal links
- optional external references
- readability metadata
- length targets
- guardrails
- validation summary
- score summary
- future-ready performance metadata

Persistence targets:
- `WebsiteStructure.seo.contentOptimization`
- `WebsitePage.seo.contentOptimization`
- `GeneratedBlogPost.seo.optimization`
- `GeneratedArticle.seo.optimization`
- `website_seo_metadata.metadata_json` JSON payloads

## Performance and cost notes

- website SEO still uses the existing focused website SEO generation path
- blog/article SEO enrichment is deterministic and reused from existing content, avoiding extra AI calls
- internal linking, scoring, readability, and validation are computed locally

## Preview and editing

- `app/api/seo/preview/route.ts` returns unified SEO preview payloads
- `app/api/seo/save/route.ts` persists SEO overrides back through existing draft save/versioning flows
- `components/editor/editor-page-settings-panel.tsx` exposes page-level SEO title, description, keyword, and canonical overrides before publish

## Future-ready monitoring metadata

The shared SEO payload stores:
- evaluation version
- last evaluated timestamp
- monitor fields
- analytics-ready flag

This keeps analytics/reporting out of MVP while leaving typed hooks for future stories.

## Task-to-file mapping

1. Define SEO content requirements and scope  
   - `docs/ai/seo-content-generation.md`
2. Define SEO content schema  
   - `lib/seo/types.ts`, `lib/seo/schema.ts`
3. Define keyword strategy and input handling  
   - `lib/seo/keywords.ts`, `lib/blog/types.ts`, `lib/article/types.ts`, `lib/ai/prompts/types.ts`
4. Implement keyword integration in content generation  
   - `lib/blog/prompts.ts`, `lib/article/prompts.ts`, `lib/blog/seo.ts`, `lib/article/seo.ts`
5. Generate SEO-optimized titles and headings  
   - `lib/seo/generation.ts`, `lib/blog/seo.ts`, `lib/article/seo.ts`
6. Generate SEO-optimized meta descriptions  
   - `lib/seo/generation.ts`, `lib/blog/seo.ts`, `lib/article/seo.ts`
7. Optimize content structure for SEO  
   - `lib/seo/generation.ts`, `lib/seo/validation.ts`, `lib/blog/validation.ts`, `lib/article/validation.ts`
8. Implement internal linking strategy  
   - `lib/seo/links.ts`, `lib/blog/generation.ts`, `lib/article/generation.ts`, `lib/ai/seo/service.ts`
9. Implement external linking suggestions (optional)  
   - `lib/seo/types.ts`, `lib/seo/generation.ts`, `lib/article/seo.ts`
10. Implement content readability optimization  
    - `lib/seo/generation.ts`, `lib/seo/scoring.ts`
11. Implement content length optimization  
    - `lib/seo/generation.ts`, `lib/blog/seo.ts`, `lib/article/seo.ts`
12. Implement SEO content guardrails  
    - `lib/seo/validation.ts`, `lib/blog/validation.ts`, `lib/article/validation.ts`
13. Implement SEO scoring and validation  
    - `lib/seo/scoring.ts`, `lib/seo/validation.ts`
14. Integrate SEO optimization with content generation systems  
    - `lib/blog/generation.ts`, `lib/article/generation.ts`, `lib/ai/seo/service.ts`, `lib/ai/seo/fallback.ts`
15. Store SEO data and metadata  
    - `lib/seo/storage.ts`, `lib/ai/structure/types.ts`, `lib/ai/seo/types.ts`
16. Implement SEO preview and editing controls  
    - `app/api/seo/preview/route.ts`, `app/api/seo/save/route.ts`, `components/editor/editor-page-settings-panel.tsx`, `components/editor/website-editor-shell.tsx`
17. Test SEO content generation across scenarios  
    - `lib/seo/scenarios.ts`, `lib/blog/scenarios.ts`, `lib/article/scenarios.ts`, `docs/ai/seo-content-tests.md`
18. Optimize SEO generation performance and cost  
    - `lib/seo/generation.ts`, `docs/ai/seo-content-generation.md`
19. Monitor SEO content performance (future-ready only)  
    - `lib/seo/types.ts`, `lib/seo/generation.ts`, `docs/ai/seo-content-generation.md`
20. Document SEO content generation system  
    - `docs/ai/seo-content-generation.md`, `docs/ai/seo-content-tests.md`
