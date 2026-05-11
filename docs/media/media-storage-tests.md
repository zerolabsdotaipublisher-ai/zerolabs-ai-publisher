# Media Storage Integration Tests (ZLAP-STORY 10-1)

## Manual/API validation checklist

1. Upload image/document/video through `POST /api/media/upload` with multipart `file` payload.
2. Verify unsupported MIME type or oversize uploads return validation errors.
3. Verify owner-scoped listing via `GET /api/media/list` with pagination and filters.
4. Verify single media retrieval via `GET /api/media/[mediaId]` returns metadata + signed access.
5. Verify signed URL endpoint `GET /api/media/[mediaId]/signed-url` returns expiring URL.
6. Verify deletion via `DELETE /api/media/[mediaId]/delete` removes provider object and soft-deletes metadata.
7. Verify quota bytes/files adjust on upload and delete.
8. Verify editing integration:
   - upload in media edit panel
   - open selector dialog
   - select asset and confirm references update
9. Verify tenant namespace object keys are under `tenant/{tenantId}/ai-publisher/...`.
10. Verify no media business logic was added under `services/zeroflow`.

## Required repo validation commands

- `npm run lint`
- `npm run build`

## Expected result

- Lint/build pass.
- Media APIs enforce authenticated owner scope.
- Signed URLs are generated through provider adapter.
- Metadata and quota records persist in AI Publisher tables.
