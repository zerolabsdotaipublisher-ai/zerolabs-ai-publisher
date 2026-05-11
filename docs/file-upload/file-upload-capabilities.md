# File Upload Capabilities (ZLAP-STORY 10-4)

## Architecture

AI Publisher owns file upload workflows, metadata, validation, lifecycle tracking, associations, and UI behavior.

This story reuses existing AI Publisher media infrastructure instead of duplicating storage or provider logic:
- `lib/media/*` for binary storage, quotas, MIME rules, signed URLs, and deletion
- `lib/website-media-library/*` for website-specific library behavior
- existing editor/media flows for content management and reusable media selection

No file upload business logic was moved into `services/zeroflow`, and no new storage provider layer was introduced.

## Data model

### `file_uploads`
Tracks upload lifecycle and metadata:
- owner scope (`user_id`, `tenant_id`)
- linked `media_id` from the existing media storage system
- source (`media_library`, `website_editing`, `social_publishing`, `content_management`)
- lifecycle status (`selected`, `validating`, `uploading`, `uploaded`, `failed`, `canceled`)
- usage context, file metadata, linked content references
- retry count, last error fields, lifecycle JSON
- association summary, metadata, completion/cancel/delete timestamps

### `file_upload_associations`
Tracks upload relationships without exposing raw storage paths:
- upload ownership scope
- association type/id for website, page, section, content record, media library, website media library, or social post
- optional content id/type and metadata JSON

## API surface

- `POST /api/file-upload`
- `POST /api/file-upload/batch`
- `GET /api/file-upload/[fileId]`
- `DELETE /api/file-upload/[fileId]/delete`
- `GET /api/file-upload/[fileId]/signed-url`

Existing upload routes continue to work and now reuse the shared upload workflow:
- `POST /api/media/upload`
- `POST /api/website-media-library/upload`

## UI surface

Reusable components:
- `components/file-upload/file-upload-panel.tsx`
- `file-upload-dropzone.tsx`
- `file-upload-input.tsx`
- `file-upload-list.tsx`
- `file-upload-progress.tsx`
- `file-upload-status-badge.tsx`

Integrated flows:
- media library upload panel (`components/media/media-upload-panel.tsx`)
- website media library upload panel (`components/website-media-library/website-media-upload-panel.tsx`)
- content management editor media panel (`components/editing/media-edit-panel.tsx`)
- social publishing editor media panel (`components/social/social-post-editor.tsx`)

## Secure access and deletion

- Files still use tenant-isolated object namespaces: `tenant/{tenantId}/ai-publisher/...`
- Raw bucket/object keys remain server-only
- Signed URLs are resolved through owned upload/media routes
- File deletion reuses existing media deletion and cleanup behavior before marking upload records deleted

## Validation and lifecycle

Client-side:
- file required
- non-zero size
- accepted MIME/extension pattern
- max file size check

Server-side:
- existing media validation
- owner/tenant resolution
- association/reference validation
- usage-context enforcement through shared media upload flow

Lifecycle states tracked in `file_uploads.lifecycle_json`:
- selected
- validating
- uploading
- uploaded
- failed
- canceled

## Monitoring and reliability

- upload, batch, detail, signed-url, and delete events are logged via `lib/file-upload/monitoring.ts`
- failure metadata includes upload id, source, file name, bytes, and retry count
- retry uses the same owned upload record when possible
- batch uploads return per-file success or failure results

## Exact task-to-file mapping (1-22)

1. Define File Upload Requirements → `docs/file-upload/file-upload-capabilities.md`, `lib/file-upload/scenarios.ts`
2. Define File Upload Data Model → `lib/file-upload/types.ts`, `lib/file-upload/model.ts`, `supabase/migrations/20260511043000_file_upload_capabilities.sql`
3. Design File Upload UX and UI Patterns → `components/file-upload/file-upload-panel.tsx`, `components/file-upload/file-upload-list.tsx`, `components/file-upload/file-upload-status-badge.tsx`
4. Implement Base Upload UI Component → `components/file-upload/file-upload-panel.tsx`
5. Implement Drag-and-Drop Upload Support → `components/file-upload/file-upload-dropzone.tsx`
6. Implement File Input Selection Support → `components/file-upload/file-upload-input.tsx`
7. Implement Client-Side File Validation → `components/file-upload/file-upload-panel.tsx`
8. Implement Backend Upload Endpoint or Service → `app/api/file-upload/route.ts`, `lib/file-upload/workflow.ts`
9. Integrate Uploads with Storage Provider → `lib/file-upload/workflow.ts`, `lib/media/workflow.ts`
10. Implement Upload Progress Tracking → `components/file-upload/file-upload-progress.tsx`, `components/file-upload/file-upload-list.tsx`
11. Implement Upload Success Handling → `components/file-upload/file-upload-panel.tsx`, `app/api/file-upload/route.ts`
12. Implement Upload Failure and Retry Handling → `components/file-upload/file-upload-panel.tsx`, `lib/file-upload/workflow.ts`
13. Implement Multi-File Upload Support → `components/file-upload/file-upload-panel.tsx`, `app/api/file-upload/batch/route.ts`
14. Implement Upload Status Lifecycle → `lib/file-upload/lifecycle.ts`, `lib/file-upload/model.ts`, migration lifecycle JSON
15. Implement File Association with Content or Records → `lib/file-upload/associations.ts`, `lib/file-upload/storage.ts`, `app/api/website-media-library/upload/route.ts`
16. Implement Access Control for File Uploads → `lib/file-upload/permissions.ts`, file upload API routes
17. Implement Secure File Access Pattern → `app/api/file-upload/[fileId]/signed-url/route.ts`, `lib/file-upload/workflow.ts`, existing media signed URL flow
18. Implement File Deletion and Cleanup Support → `app/api/file-upload/[fileId]/delete/route.ts`, `lib/file-upload/workflow.ts`, `lib/website-media-library/workflow.ts`
19. Implement Upload Logging and Monitoring → `lib/file-upload/monitoring.ts`, `lib/file-upload/workflow.ts`
20. Optimize Upload Performance and Reliability → `app/api/file-upload/batch/route.ts`, `lib/file-upload/workflow.ts`, `components/file-upload/file-upload-panel.tsx`
21. Test File Upload Capabilities Across Scenarios → `docs/file-upload/file-upload-tests.md`
22. Document File Upload Capabilities → `docs/file-upload/file-upload-capabilities.md`

## MVP boundaries

Included:
- reusable upload UI across requested product areas
- single and batch upload APIs
- upload lifecycle tracking and retry support
- structured metadata responses
- owner-scoped signed access and deletion hooks
- upload association tracking

Excluded:
- enterprise DAM workflows
- CDN orchestration
- billing engine work
- collaborative file governance
- new ZeroFlow services
