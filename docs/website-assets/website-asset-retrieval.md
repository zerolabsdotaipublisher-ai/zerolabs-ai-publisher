# Website Asset Retrieval (ZLAP-STORY 10-6)

## Architecture

AI Publisher owns website asset retrieval inside the product app by reusing the existing media storage, AI asset, website media library, signed URL, preview, and storage-access permission layers.

This implementation does **not** create a duplicate storage, permission, or asset delivery platform:
- canonical website asset IDs reuse `website_media_library_items.id`
- media bytes still come from the existing media storage/provider workflows
- signed URL creation still uses the existing media/storage-access stack
- website-specific retrieval rules stay inside `lib/website-asset-retrieval`
- no business logic was added under `services/zeroflow`

## Retrieval model

Canonical asset resolution is backed by the existing website media library record plus linked media/AI asset metadata.

Supported lookups:
- `assetId` / `libraryItemId` → canonical website asset id
- `mediaId`
- `aiAssetId`
- `websiteId`
- `contentId` + `contentType`
- `pageId`
- `sectionId`

The retrieval layer derives website/content associations from existing:
- `website_media_library_items.association_summary_json`
- `website_media_library_usage`
- linked `media_assets`
- linked `ai_assets`
- linked `website_structures` publication state

## Delivery behavior

- Draft/editor/owner-preview assets stay protected.
- Shared preview assets require a valid preview token and matching website association.
- Published website assets can be anonymously resolved through `/api/website-assets/[assetId]` without exposing raw object keys.
- Direct signed URLs are generated through `/api/website-assets/[assetId]/url` and the retrieval workflow only after permission checks pass.
- The app render route remains the stable, cacheable URL surface for website content.

## Caching and fallbacks

- Retrieval metadata uses a lightweight in-memory cache.
- Direct signed URL responses are cached until expiration.
- Published asset routes return cache-friendly headers.
- Missing/failed asset delivery falls back to `/file.svg` so a single asset does not break page rendering.

## Rendering integration

- Website media library selections now store canonical `/api/website-assets/[assetId]` URLs instead of short-lived preview URLs.
- Generated-site renderers now render actual image URLs for hero and image components.
- Shared preview pages rewrite canonical website asset URLs with the preview token so protected preview assets still load.

## APIs

- `GET /api/website-assets/[assetId]` → redirect/render endpoint for browsers and website rendering
- `GET /api/website-assets/[assetId]/url` → direct signed/public-safe access URL metadata
- `GET /api/website-assets/resolve` → resolve a single website asset by supported identifiers
- `GET /api/website-assets/list` → list website assets for authenticated website/editor/media-library contexts

## Observability and errors

Structured website asset logs capture:
- retrieval list/resolve/url/render activity
- misses and provider failures
- fallback usage
- scope failures through the existing storage-access error model

## Exact task-to-file mapping (1-18)

1. Define Asset Retrieval Requirements → `docs/website-assets/website-asset-retrieval.md`, `lib/website-asset-retrieval/scenarios.ts`
2. Define Asset Retrieval Data Model → `lib/website-asset-retrieval/types.ts`, `lib/website-asset-retrieval/model.ts`
3. Design Asset Retrieval Architecture → `docs/website-assets/website-asset-retrieval.md`, `lib/website-asset-retrieval/index.ts`
4. Implement Asset Retrieval Service Layer → `lib/website-asset-retrieval/storage.ts`, `lib/website-asset-retrieval/workflow.ts`
5. Implement Public Asset Access for Published Websites → `app/api/website-assets/[assetId]/route.ts`, `lib/website-asset-retrieval/workflow.ts`
6. Implement Secure Retrieval for Private and Draft Assets → `lib/website-asset-retrieval/permissions.ts`, `app/api/website-assets/[assetId]/url/route.ts`
7. Implement Asset URL Generation Logic → `lib/website-asset-retrieval/urls.ts`, `lib/website-asset-retrieval/workflow.ts`
8. Implement Asset Retrieval API Endpoints → `app/api/website-assets/[assetId]/route.ts`, `app/api/website-assets/[assetId]/url/route.ts`, `app/api/website-assets/resolve/route.ts`, `app/api/website-assets/list/route.ts`
9. Integrate Asset Retrieval with Website Rendering → `components/generated-site/section-renderer.tsx`, `components/generated-site/component-renderer.tsx`
10. Integrate Asset Retrieval with Editor and Preview → `components/editor/editor-text-panel.tsx`, `app/preview/share/[token]/page.tsx`, `lib/website-media-library/model.ts`
11. Implement Caching Strategy for Asset Retrieval → `lib/website-asset-retrieval/cache.ts`, `lib/website-asset-retrieval/workflow.ts`
12. Implement Asset Fallback Handling → `lib/website-asset-retrieval/fallbacks.ts`, `app/api/website-assets/[assetId]/route.ts`
13. Implement Access Control Enforcement → `lib/website-asset-retrieval/permissions.ts`, `lib/website-asset-retrieval/workflow.ts`
14. Implement Logging and Monitoring for Asset Retrieval → `lib/website-asset-retrieval/monitoring.ts`, `lib/website-asset-retrieval/workflow.ts`
15. Implement Error Handling for Asset Retrieval → `app/api/website-assets/[assetId]/url/route.ts`, `app/api/website-assets/resolve/route.ts`, `lib/website-asset-retrieval/permissions.ts`
16. Optimize Asset Retrieval Performance → `supabase/migrations/20260511070000_website_asset_retrieval.sql`, `lib/website-asset-retrieval/storage.ts`, `lib/website-asset-retrieval/cache.ts`
17. Test Asset Retrieval Across Scenarios → `docs/website-assets/website-asset-retrieval-tests.md`, `lib/website-asset-retrieval/scenarios.ts`
18. Document Asset Retrieval System → `docs/website-assets/website-asset-retrieval.md`

## MVP boundaries

Included:
- website asset lookup and delivery for live, preview, editor, media-library, and practical social/direct URL use cases
- published anonymous delivery via safe app routes
- preview-token support for shared preview assets
- canonical website asset render URLs stored in website content
- structured logging, fallback redirects, and indexed metadata lookups

Excluded:
- advanced CDN orchestration
- custom image optimization service
- enterprise DAM delivery platform
- static asset pipeline rewrite
- external policy engine
- billing logic
