# Website Static Site Generation

ZLAP-STORY 5-2 extends the Story 5-1 build and deployment pipeline with static-site-generation-ready output. AI Publisher owns this layer because website generation, rendering strategy, product metadata, route behavior, and delivery semantics are Layer 1 responsibilities. ZeroFlow remains a shared platform layer and does not own page rendering or SSG logic.

## Strategy

The MVP strategy is build-time SSG for every visible page in the existing `WebsiteStructure`.

| Scope | MVP behavior |
|---|---|
| Static pages | Every `WebsiteStructure.pages[]` entry where `visible !== false` |
| Hidden pages | Excluded from route generation and static output |
| Build-time data | Structure identity, page data, visible sections, navigation, metadata/SEO, layout/style references, and asset references |
| On-demand generation | Not enabled in MVP |
| Hybrid rendering | Not enabled in MVP |
| ISR | Foundation is represented in typed helpers, but revalidation is disabled with `revalidate: false` |
| Production | Pipeline emits static route/page artifacts for the deployment adapter |
| Preview | Pipeline emits the same static artifacts while current preview routes continue to serve live preview behavior |

The build still starts from the existing pipeline entry points:

- `runWebsiteDeploymentPipeline()`
- `deployWebsitePreview()`
- `deployWebsiteProduction()`
- `buildWebsiteStructure()`

No second website model or second build path is introduced. `PipelineBuildOutput` now carries the original `WebsiteStructure`, the Story 5-1 renderable manifest, and an `ssg` artifact.

## Data Requirements

Static page generation requires these data groups:

| Requirement | Required fields |
|---|---|
| Structure | `id`, `version`, `websiteType`, `siteTitle`, `tagline` |
| Page | `id`, `slug`, `title`, `type`, `order`, `visible` |
| Sections | visible `sections[].id`, `sections[].type`, `sections[].order`, `sections[].content`, optional `components`, optional `styleHints` |
| Navigation | `navigation.primary`, optional `navigation.footer`, optional menus and hierarchy |
| Metadata/SEO | site SEO, page SEO title, description, keywords, canonical URL, Open Graph metadata |
| Layout/style | `styleConfig`, optional matching `layout.pages[]` entry |
| Assets | section, component, and SEO Open Graph asset references |

The typed contract is `StaticPageData` in `lib/pipeline/ssg/types.ts`. Completeness is tracked by `StaticPageInputCompleteness`, and validation reports typed `StaticValidationIssue` values rather than unstructured strings.

## Data Flow

1. Pipeline validation calls `validateStaticSiteReadiness()`.
2. The build step calls `buildStaticSiteOutput()`.
3. `resolveStaticSiteData()` maps the product-owned `WebsiteStructure` into SSG-ready page data.
4. `createStaticPageRoutes()` creates static routes for visible pages.
5. `createStaticOutputManifest()` describes expected static file organization.
6. `validateStaticSiteArtifact()` validates data completeness, route coverage, output shape, cache policy references, and assets.
7. The deployment adapter receives the existing `PipelineBuildOutput`, now including `build.ssg`.

The SSG data layer intentionally avoids `sourceInput`, management metadata, publication history, auth state, and preview UI state. Those fields remain product/application concerns and are not needed in static page payloads.

## Routing

Static routes are site-relative:

| Page slug | Static route path | Page data path | HTML expectation |
|---|---|---|---|
| `/` | `/` | `data/{structureId}/pages/index.json` | `pages/index.html` |
| `/about` | `/about` | `data/{structureId}/pages/about.json` | `pages/about/index.html` |
| `/services/design` | `/services/design` | `data/{structureId}/pages/services__design.json` | `pages/services/design/index.html` |

Dynamic route static generation helpers live in `lib/pipeline/ssg/framework.ts`:

- `NEXT_STATIC_GENERATION_CONFIG`
- `createNextStaticParamsForRoutes()`
- `createNextStaticParamsForSites()`
- `createNextMetadataForStaticPage()`

These helpers are intentionally small. The current generated-site route can continue to render through existing app routes while the pipeline produces route/page artifacts needed by a future static host implementation.

## Asset Handling

Asset references are represented in `StaticAssetReference` records. The MVP recognizes:

- root-relative public asset paths such as `/assets/...`, `/images/...`, `/media/...`, and `/fonts/...`
- image and document URLs with common static extensions
- absolute `http` and `https` URLs
- `data:image/...` references
- SEO Open Graph images

Local asset paths are validated for safe public-path shape and must not include path traversal or whitespace. External assets are referenced but not cached or copied by AI Publisher in this MVP.

## Metadata and SEO

Static page artifacts include build-time metadata:

- title
- description
- keywords
- canonical URL when present
- Open Graph metadata when present

The resolver uses page-level SEO first and falls back to site-level SEO. This keeps output aligned with the existing AI Publisher metadata system instead of creating a separate SEO model.

## Performance Rules

The SSG artifact is optimized for MVP safety:

- static page data includes only render-required fields, not the full `WebsiteStructure`
- visible sections only are emitted
- route and asset references are deduplicated
- source input, publication state, management state, and user/auth state are excluded
- page data above 128 KB emits a typed warning

These rules keep artifacts CDN-friendly without adding a bundling or minification layer before a real host integration exists.

## Caching and CDN

`lib/pipeline/ssg/cache.ts` defines provider-neutral cache policy helpers:

| Policy | Target | Browser max age | CDN max age | Notes |
|---|---|---:|---:|---|
| `static-page-html` | HTML | 0 | 300s | Refreshed by redeploying the generated site |
| `static-page-data` | JSON | 0 | 300s | Follows page HTML freshness |
| `static-assets` | Local assets | 1 year | 1 year | Intended for content-addressed assets |
| `external-assets` | External references | 0 | 0 | Not controlled by AI Publisher |

No provider-specific CDN dependency is added in this story. Deployment adapters can translate these policies later.

## Observability

The existing pipeline observer receives these SSG events:

- `pipeline_ssg_started`
- `pipeline_ssg_completed`
- `pipeline_ssg_failed`

Completion events include duration plus generated page, route, and asset counts. Failures are logged through the existing pipeline logger and returned as typed validation failures.

## Validation

SSG validation covers:

- page data completeness
- metadata presence
- visible section presence
- static route validity
- duplicate route prevention
- visible-page route coverage
- output file organization
- cache policy references
- asset URL safety
- page data payload budget warnings

Invalid SSG output blocks deployment before any adapter is called.

## MVP Boundaries

- ISR is not enabled. `NEXT_STATIC_GENERATION_CONFIG.revalidate` is `false`.
- No provider-specific CDN headers or deployment APIs are added.
- No static export host is implemented.
- No new website/build model is introduced.
- ZeroFlow is not imported by SSG modules.
- Raw environment access remains limited to `config/env.ts`.
