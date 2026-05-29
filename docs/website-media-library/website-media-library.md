# Website Media Library (ZLAP-STORY 10-3)

## Architecture

Website media library management lives entirely inside AI Publisher. The feature reuses:
- `lib/media/*` from ZLAP-STORY 10-1 for upload, storage provider access, secure signed URLs, and media deletion.
- `lib/ai-assets/*` from ZLAP-STORY 10-2 so AI-generated assets can appear in the website media library without duplicating storage objects.

No website media library logic was added under `services/zeroflow`, and no new storage provider layer was introduced.

## Ownership and namespace boundaries

- Binary files still live in the existing tenant-isolated namespace: `tenant/{tenantId}/ai-publisher/...`
- AI Publisher owns `website_media_library_items` and `website_media_library_usage`
- Signed preview URLs are returned by `/api/website-media-library/[mediaId]/preview`
- Raw bucket or object-key values are never returned to the UI

## Data model

### `website_media_library_items`
Stores website media metadata:
- library item id, `user_id`, `tenant_id`, optional `website_id`
- linked `media_id` and optional `ai_asset_id`
- display name, description, alt text
- media type, MIME type, file size, width, height
- tags
- usage count and usage/association summary JSON
- archived/deleted timestamps and created/updated timestamps

### `website_media_library_usage`
Tracks where media is used across website flows:
- library item/media ownership scope
- optional website/content/page/section references
- usage kind (`library`, `editor_insert`, `website_content`, `page_asset`, `section_asset`, `ai_asset_source`)
- metadata JSON and timestamps

## APIs

- `GET /api/website-media-library/list`
- `POST /api/website-media-library/upload`
- `GET /api/website-media-library/[mediaId]`
- `GET /api/website-media-library/[mediaId]/preview`
- `DELETE /api/website-media-library/[mediaId]/delete`
- `POST /api/website-media-library/[mediaId]/tags`
- `GET /api/website-media-library/[mediaId]/usage`
- `POST /api/website-media-library/[mediaId]/usage`

## UI behavior

Primary UI components:
- `components/website-media-library/website-media-library-shell.tsx`
- `website-media-library-grid.tsx`
- `website-media-library-list.tsx`
- `website-media-item-card.tsx`
- `website-media-preview-dialog.tsx`
- `website-media-selector-dialog.tsx`
- `website-media-upload-panel.tsx`
- `website-media-filters.tsx`
- loading and empty states

### Flows

#### Upload
1. User uploads from website media shell or selector context.
2. Upload reuses `uploadOwnedMedia()`.
3. AI Publisher stores website media metadata in `website_media_library_items`.
4. Initial library usage is recorded in `website_media_library_usage`.

#### Preview
1. UI requests `/preview` for the selected library item.
2. Server resolves the owned `media_id`.
3. Existing signed URL generation returns a short-lived preview URL.

#### Select / insert
1. Website editor opens `WebsiteMediaSelectorDialog`.
2. User selects a library item.
3. Selection records `editor_insert` usage metadata.
4. Signed preview URL is inserted into the selected website content field.

#### Delete / manage
- If usage records show the asset is already used in website content, delete becomes archive-only.
- If the asset is unused, the workflow deletes the underlying media or AI asset through existing story 10-1 / 10-2 workflows, then marks the library item deleted.

## Access control

- Server-side auth is required on every website media library API route.
- Owner scoping uses authenticated `user_id` plus tenant resolution.
- Optional `websiteId` inputs are checked against owned website structures.
- RLS policies on the new tables remain owner-scoped.

## Usage tracking

`website_media_library_usage` stores usage references for website/content/page/section contexts. The workflow refreshes usage summaries so the library can block unsafe deletion for in-use media.

## Performance

- List API is paginated.
- UI uses list/grid views and lightweight metadata payloads.
- Binary preview/download still uses signed URLs instead of proxying blobs through the app.
- AI asset reuse syncs metadata only; it does not duplicate storage objects.

## MVP boundaries

Included:
- browse, upload, preview, search/filter, select/insert, delete/manage, tag/organize, usage tracking, responsive UI, docs/tests

Excluded:
- enterprise DAM workflows
- advanced CDN orchestration
- collaborative asset governance
- billing engine work
- new ZeroFlow service
- full image editing
