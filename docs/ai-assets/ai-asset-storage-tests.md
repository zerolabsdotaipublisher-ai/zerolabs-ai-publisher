# AI Asset Storage Tests (ZLAP-STORY 10-2)

## Manual/API validation checklist

1. Register generated image via `POST /api/ai-assets/register-generated` (multipart) and verify AI asset + media metadata persisted.
2. Register from existing media reference (`mediaId`) via JSON payload and verify AI asset association persists.
3. Verify invalid MIME type/file-size/dimension/content association metadata is rejected.
4. List AI assets via `GET /api/ai-assets/list` with pagination, type/status/search filters.
5. Retrieve single AI asset via `GET /api/ai-assets/[assetId]` and confirm signed URL payload is included.
6. Verify `GET /api/ai-assets/[assetId]/signed-url` returns time-bound signed access without exposing raw object path.
7. Create variant via `POST /api/ai-assets/[assetId]/variants` and verify lineage fields (`originalAssetId`, `parentAssetId`, `isVariant`, `version`).
8. Replace asset via `POST /api/ai-assets/[assetId]/replace` and verify original archived + `replacementAssetId` set.
9. Delete asset via `DELETE /api/ai-assets/[assetId]/delete` and verify metadata lifecycle + media cleanup + quota updates.
10. Verify cross-user/cross-tenant access is denied and owner-scoped queries only return owned assets.
11. Verify namespace isolation remains under `tenant/{tenantId}/ai-publisher/...` through reused media storage integration.
12. Verify no AI asset business logic was introduced under `services/zeroflow`.

## Required repo validation commands

- `npm run lint`
- `npm run build`

## Expected result

- Lint/build pass.
- AI asset metadata and lifecycle persist in AI Publisher tables.
- Secure delivery always uses signed URLs.
- Media quota/accounting integration updates through existing media workflow paths.
