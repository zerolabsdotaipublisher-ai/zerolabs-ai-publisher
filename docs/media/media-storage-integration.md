# Media Storage Integration (ZLAP-STORY 10-1)

## Scope

This story implements AI Publisher-owned media storage integration with Wasabi/S3-compatible provider abstraction while keeping product-specific metadata, workflows, permissions, usage tracking, and UI inside AI Publisher.

## Architecture

- **AI Publisher owns:**
  - media metadata tables (`media_assets`, `media_usage_links`, `media_usage_quotas`)
  - media workflows and server-side permissions
  - media APIs and media UI components
  - media/content relationships and usage tracking
- **Shared layer/ZeroFlow:** no media business logic moved into `services/zeroflow`.
- **Namespace strategy:** object keys are stored under `tenant/{tenantId}/ai-publisher/...`.
- **Config discipline:** all environment variable reads remain centralized in `config/env.ts` and `config/services.ts`.

## Provider strategy

- MVP provider: **Wasabi** via S3-compatible adapter (`lib/media/provider/wasabi.ts`, `lib/media/provider/s3-compatible.ts`).
- Future-ready provider abstraction through `MediaStorageProviderAdapter`.
- Signed URL generation uses provider adapter to return time-bound secure URLs.

## Data model

### `media_assets`
Stores media metadata:
- media ID
- owner (`user_id`) and isolation scope (`tenant_id`)
- provider, bucket, object key
- mime type, media type, file size
- optional image dimensions
- optional linked content ID/type
- usage/metadata JSON, lifecycle status, timestamps

### `media_usage_links`
Tracks app workflow usage contexts per media/content linkage.

### `media_usage_quotas`
Tracks total bytes/files per owner scope for quota enforcement and future billing hooks.

## API surface

- `POST /api/media/upload`
- `GET /api/media/list`
- `GET /api/media/[mediaId]`
- `DELETE /api/media/[mediaId]/delete`
- `GET /api/media/[mediaId]/signed-url`

## UI surface

- `components/media/media-upload-panel.tsx`
- `components/media/media-upload-dropzone.tsx`
- `components/media/media-upload-progress.tsx`
- `components/media/media-library-shell.tsx`
- `components/media/media-library-grid.tsx`
- `components/media/media-card.tsx`
- `components/media/media-selector-dialog.tsx`

Editing integration reuses these components in `components/editing/media-edit-panel.tsx`.

## Exact task-to-file mapping (1-20)

1. Define Media Storage Requirements → `docs/media/media-storage-integration.md`, `lib/media/scenarios.ts`
2. Select and Finalize Storage Provider Strategy → `lib/media/provider/index.ts`, `lib/media/provider/wasabi.ts`, `lib/media/provider/s3-compatible.ts`
3. Define Media Storage Architecture → `lib/media/workflow.ts`, `lib/media/storage.ts`, `lib/media/index.ts`
4. Define Media Data Model and Metadata → `lib/media/types.ts`, `lib/media/model.ts`
5. Create Database Tables for Media Storage → `supabase/migrations/20260510232000_media_storage_integration.sql`
6. Implement Storage Provider Adapter Layer → `lib/media/provider/types.ts`, `lib/media/provider/index.ts`, `lib/media/provider/wasabi.ts`, `lib/media/provider/s3-compatible.ts`
7. Implement Media Upload API → `app/api/media/upload/route.ts`, `lib/media/workflow.ts`
8. Implement Signed URL Generation → `app/api/media/[mediaId]/signed-url/route.ts`, `lib/media/workflow.ts`
9. Implement Media Retrieval and Listing APIs → `app/api/media/list/route.ts`, `app/api/media/[mediaId]/route.ts`, `lib/media/schema.ts`
10. Implement Media Deletion and Cleanup → `app/api/media/[mediaId]/delete/route.ts`, `lib/media/workflow.ts`, `lib/media/storage.ts`
11. Implement Media Validation and Constraints → `lib/media/validation.ts`, `config/env.ts`, `config/services.ts`
12. Implement Media Integration with Content Systems → `components/editing/media-edit-panel.tsx`, `components/editing/content-editor-shell.tsx`, `lib/editing/scenarios.ts`
13. Implement Media Upload UI Components → `components/media/media-upload-panel.tsx`, `components/media/media-upload-dropzone.tsx`, `components/media/media-upload-progress.tsx`
14. Implement Media Library and Selection UI → `components/media/media-library-shell.tsx`, `components/media/media-library-grid.tsx`, `components/media/media-card.tsx`, `components/media/media-selector-dialog.tsx`
15. Implement Access Control for Media → `lib/media/permissions.ts`, media API routes
16. Implement Logging and Monitoring for Media Operations → `lib/media/monitoring.ts`, `lib/media/workflow.ts`
17. Implement Storage Quota and Usage Tracking → `lib/media/quotas.ts`, `lib/media/storage.ts`, migration quota table
18. Optimize Media Storage Performance → pagination/filtering in `lib/media/storage.ts`, signed URL TTL strategy in `lib/media/workflow.ts`
19. Test Media Storage Integration Across Scenarios → `docs/media/media-storage-tests.md`
20. Document Media Storage Integration → `docs/media/media-storage-integration.md`

## MVP boundaries

- Included: upload, retrieval/listing, signed access, library browsing, editing integration, quota tracking hooks.
- Excluded: enterprise DAM governance, advanced CDN orchestration, AI image-generation platform.
