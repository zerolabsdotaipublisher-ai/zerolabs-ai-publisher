# Website URL and Routing Architecture (ZLAP-STORY 5-4)

## Ownership and boundaries

AI Publisher (Layer 1) owns website URL generation and route behavior. This story keeps route logic in product modules (`lib/routing`, preview, publish, pipeline, frontend routes) and does not move routing into ZeroFlow services.

## URL strategy

- Base preview URL: `/preview/{structureId}`
- Base live URL: `/site/{structureId}`
- Home page route: `/`
- Inner page route: `/{slug}` or nested `/{segment}/{segment}`
- Preview page switching: query `?page=/{slug}` on preview routes
- Live page browsing: catch-all path segments under `/site/{structureId}/...`

## Routing model

`WebsiteStructure.routing` stores product-owned persistent route metadata:

- `routes[]`: typed page route records
- `redirects[]`: typed redirects when page paths change
- `reservedPaths[]`: blocked system route prefixes
- `urls`: preview/live base path + absolute URL records

## Route generation

`lib/routing/mapping.ts` builds deterministic routes from `WebsiteStructure.pages`:

- home page resolves to `/`
- page slugs are normalized into SEO-friendly lowercase paths
- nested pages may include parent path context
- duplicate paths are deterministically deduplicated (`-2`, `-3`, ...)
- navigation hrefs are synchronized to resolved routes

## Validation

`lib/routing/validation.ts` enforces:

- route syntax validity
- per-site path uniqueness
- reserved system path blocking

Routing validation is integrated into publish and pipeline validation.

## Preview and live routing

- Preview remains owner/shared-protected using existing access controls.
- Live/public route resolution uses `app/site/[id]/[[...slug]]/page.tsx`.
- Live route access requires publication state `published`.
- Unknown routes return `notFound()`.
- Changed routes can resolve via stored redirects.

## Frontend resolution

`lib/routing/resolution.ts` resolves a path to:

- page route
- redirect target
- not found

Renderer now supports strict route mode for 404-safe rendering on live routes.

## Pipeline and SSG integration

- SSG route generation now reads product routing records (`getWebsiteRoutingConfig`).
- Pipeline route manifests derive from the same route records.
- No second router or deployment model is introduced.

## Route updates and redirects

When website pages/slugs change (generation, regeneration, editor save):

- routes are regenerated and persisted in `WebsiteStructure.routing`
- changed paths produce typed redirect records

## Access control and isolation

- Preview owner routes stay user-scoped.
- Shared preview requires signed expiring tokens.
- Unpublished sites are not publicly resolvable.
- Live route is public only for published websites.

## MVP boundaries

- Routing remains in AI Publisher only.
- No ZeroFlow route ownership.
- No custom-domain CMS router overbuild.
- Existing preview/publish/hosting architecture is extended, not replaced.
- SSG + hosting integration from Stories 5-2/5-3 stays intact.

## Story task to file mapping (1-20)

1. Requirements: `docs/routing/website-url-routing.md`
2. URL strategy: `docs/routing/website-url-routing.md`, `config/routes.ts`
3. Routing model: `lib/routing/types.ts`, `lib/ai/structure/types.ts`
4. Base URL records: `lib/routing/mapping.ts`
5. Slug generation: `lib/routing/slugs.ts`, `lib/routing/mapping.ts`
6. Multi-page mapping: `lib/routing/mapping.ts`
7. Uniqueness/syntax validation: `lib/routing/validation.ts`
8. Reserved paths: `lib/routing/reserved.ts`, `lib/editor/validation.ts`
9. Preview routing: `lib/preview/mapping.ts`, `lib/preview/validation.ts`, existing preview routes
10. Published routing: `config/routes.ts`, `lib/pipeline/urls.ts`, `lib/publish/urls.ts`, `app/site/[id]/[[...slug]]/page.tsx`
11. Navigation integration: `lib/routing/mapping.ts`, `lib/editor/navigation.ts` (existing usage)
12. Pipeline/SSG integration: `lib/pipeline/build.ts`, `lib/pipeline/ssg/routes.ts`, `lib/pipeline/validation.ts`
13. Frontend route resolution: `lib/routing/resolution.ts`, `components/generated-site/renderer.tsx`, `app/site/[id]/[[...slug]]/page.tsx`
14. Fallback/error routes: `app/site/[id]/[[...slug]]/page.tsx`, renderer strict route handling
15. Route regeneration: `lib/routing/storage.ts`, `lib/ai/structure/generator.ts`, `lib/ai/structure/regeneration.ts`, `lib/editor/storage.ts`
16. Redirect handling: `lib/routing/redirects.ts`, `lib/routing/resolution.ts`, `app/site/[id]/[[...slug]]/page.tsx`
17. Route persistence/retrieval: `lib/ai/structure/types.ts`, `lib/routing/storage.ts`
18. Access control/isolation: existing preview security + `app/site/[id]/[[...slug]]/page.tsx` publication gating
19. Scenario coverage: `lib/routing/scenarios.ts`, `docs/routing/website-url-routing-tests.md`
20. Architecture documentation: `docs/routing/website-url-routing.md`
