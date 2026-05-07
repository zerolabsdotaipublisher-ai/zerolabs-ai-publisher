# Content Revision History (ZLAP-STORY 9-4)

## Scope

Revision history is implemented inside AI Publisher and reuses existing content library, editing, review, approval, and publishing domains.

Supported content types:
- website/page content (`website_page`)
- blog posts (`blog_post`)
- articles (`article`)
- social posts (`social_post`)

## Triggered revision events

- `content_created` baseline snapshot (lazy bootstrap on first revision interaction)
- `manual_save` from editing save workflow
- `autosave_checkpoint` from autosave workflow (throttled + meaningful changes only)
- `ai_regenerate` from regeneration workflows/routes
- `approval_submit`, `approval_approve`, `approval_reject`, `approval_request_changes`
- `publish`, `publish_update`
- `restore`

## Stored revision fields

Each revision stores:
- `content_id`, `content_type`, `source_id`, optional `structure_id`
- `id` and sequential `version_number` per `user_id + content_id`
- `snapshot_json` (typed content snapshot draft)
- `summary_json` (section/word/keyword/media counts + workflow states)
- `action_type`
- `change_summary`
- `metadata_json`
- `related_workflow_ids`
- timestamps and optional restore linkage

## APIs

- `GET /api/revisions/[contentId]` list revisions (paged)
- `GET /api/revisions/[contentId]/[revisionId]` revision detail
- `POST /api/revisions/[contentId]/compare` compare two revisions
- `POST /api/revisions/[contentId]/restore` restore one revision with explicit confirmation

## Restore behavior

Restore applies the stored editable draft through existing editing save workflow, so it re-enters review/approval gating and creates a new `restore` revision.
