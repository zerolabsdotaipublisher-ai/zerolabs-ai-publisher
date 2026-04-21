# Website URL and Routing Scenario Coverage

## Scenario checklist

- [x] Homepage route resolves to `/`
- [x] Multi-page route mapping resolves all visible pages
- [x] Duplicate slug conflict deduplicates paths
- [x] Reserved path conflict is rejected by validation
- [x] Preview route access remains owner/shared-token scoped
- [x] Live route access works only for published websites
- [x] Invalid live route returns 404
- [x] Renamed page route creates redirect metadata
- [x] Route regeneration runs after generation/regeneration/editor save

## Covered modules

- `lib/routing/scenarios.ts`
- `lib/routing/mapping.ts`
- `lib/routing/validation.ts`
- `lib/routing/resolution.ts`
- `lib/preview/*` route mapping/validation
- `lib/pipeline/*` route manifest + validation integration
- `app/site/[id]/[[...slug]]/page.tsx`
