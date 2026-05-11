# AI Asset Storage Architecture (ZLAP-STORY 10-2)

## Scope

This story adds AI-generated image/asset persistence and retrieval inside AI Publisher while reusing the existing media storage integration from ZLAP-STORY 10-1.

## Ownership boundaries

- **AI Publisher owns:** AI asset metadata (`ai_assets`), lifecycle semantics, prompt/generation context, content associations, and AI asset APIs/UI.
- **Reused platform integration:** media storage provider abstraction, signed URL generation, media metadata persistence, quota tracking, and namespace strategy.
- **Not added:** AI asset business logic in `services/zeroflow`, duplicate storage platform, raw public object path exposure.

## Storage and namespace strategy

- Binary file storage uses existing media workflow (`lib/media/workflow.ts`) and provider adapters.
- Keys remain tenant-isolated under the established media namespace (`tenant/{tenantId}/ai-publisher/...`).
- AI assets store `media_id` references and retrieve files via signed URLs only.

## Data model

`public.ai_assets` stores:
- IDs and ownership: `id`, `user_id`, `tenant_id`, `media_id`
- Type/purpose/format: `asset_type`, `asset_purpose`, `mime_type`, `file_size_bytes`, `width`, `height`
- Lifecycle: `status`, `lifecycle_json`, `archived_at`, `deleted_at`
- Generation context: `source_workflow`, `generation_provider`, `generation_model`, `prompt_text`, `prompt_hash`, `prompt_metadata_json`, `generation_settings_json`, `generation_target_json`
- Relationships/versioning: `original_asset_id`, `parent_asset_id`, `replacement_asset_id`, `version`, `is_variant`
- Content associations: `linked_content_id`, `linked_content_type`
- Metadata and timestamps: `context_metadata_json`, `usage_metadata_json`, `created_at`, `updated_at`

## Lifecycle states

Supported statuses:
- `generating`
- `available`
- `attached`
- `published`
- `archived`
- `failed`
- `deleted`

Status transitions are enforced in `lib/ai-assets/lifecycle.ts` and applied through workflow operations.

## API surface

- `POST /api/ai-assets/register-generated`
- `GET /api/ai-assets/list`
- `GET /api/ai-assets/[assetId]`
- `GET /api/ai-assets/[assetId]/signed-url`
- `DELETE /api/ai-assets/[assetId]/delete`
- `POST /api/ai-assets/[assetId]/replace`
- `GET /api/ai-assets/[assetId]/variants`
- `POST /api/ai-assets/[assetId]/variants`

## Security and access control

- Server-side ownership checks by `user_id` and tenant scoping.
- RLS policies on `ai_assets` enforce owner isolation.
- Signed URL access resolves through owned media references.
- No raw bucket/object key values are returned by AI asset APIs.

## Usage/quota and accounting

- AI asset uploads use existing media upload/delete workflows.
- Storage byte/file accounting reuses media quota tables and update logic.
- `usage_metadata_json` provides future hooks for usage ledger/billing integration.

## Original vs derived handling

- `original_asset_id` points to the root original asset.
- `parent_asset_id` tracks direct lineage.
- `replacement_asset_id` links archived/replaced assets.
- `is_variant` + `version` support variant/replacement library handling.

## Error handling and recovery

- Registration rolls back uploaded media when metadata persistence fails.
- Deletion coordinates metadata lifecycle and media cleanup.
- APIs return explicit error payloads for validation/ownership/not-found scenarios.

## MVP boundaries

Included:
- Persistence/retrieval of AI-generated images and assets
- Prompt/generation context metadata
- Variants and replacement flow support
- Signed URL secure delivery
- AI asset library APIs and UI shell components

Excluded:
- Full AI image generation orchestration platform
- Advanced DAM governance and collaboration
- CDN orchestration
- Full billing implementation
