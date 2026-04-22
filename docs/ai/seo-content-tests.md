# SEO Content Generation Test Coverage (ZLAP-STORY 6-3)

## Scenario coverage

- website page SEO with service-page style keyword clustering
- blog SEO with informational intent and natural keyword placement
- article SEO with long-form structure and optional external references
- preview payload generation for website/blog/article
- SEO save flow through existing draft/versioning pipeline
- internal link generation against existing route structures
- guardrail behavior for missing metadata, duplicate headings, and overused primary keywords

## Scenario fixtures

- `lib/seo/scenarios.ts`
- `lib/blog/scenarios.ts`
- `lib/article/scenarios.ts`

## Manual validation checklist

1. `npm run lint`
2. `NEXT_PUBLIC_APP_NAME=AI\ Publisher NEXT_PUBLIC_APP_URL=http://localhost:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test SUPABASE_SERVICE_ROLE_KEY=test OPENAI_API_KEY=test npm run build`
3. verify no raw `process.env` outside `config/*`
4. verify no changes under `services/zeroflow`
5. verify SEO preview/save flows reuse WebsiteStructure, routing, preview, versioning, and publish-compatible draft saves

## Edge cases

- no explicit SEO keyword input, fallback to legacy keyword arrays
- keyword-heavy inputs still produce warnings rather than blocking saves
- page-level editor overrides keep structure storage aligned with SEO optimization metadata
- external reference suggestions remain lightweight metadata only
