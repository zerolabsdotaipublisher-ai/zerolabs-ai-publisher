# Generated Content Storage Tests (ZLAP-STORY 6-6)

## Scope

Validate storage reliability and retrieval compatibility for generated websites/pages/sections/blog/article/SEO/scheduling/versions under owner-scoped access.

## Test scenarios

1. **Initial website generated content save**
   - Generate structure + content.
   - Assert rows in `website_structures`, `website_generated_content`, `website_seo_metadata`.
   - Assert lifecycle defaults (`generated` / `draft`) and audit fields (`created_by`, `updated_by`).

2. **Initial blog save path**
   - Generate blog.
   - Assert `blog_posts` row and mirrored website content rows.
   - Assert lifecycle (`generated` or `scheduled`) based on publish metadata.

3. **Initial article save path**
   - Generate article.
   - Assert `article_posts` row and mirrored website content rows.
   - Assert lifecycle and audit fields.

4. **Draft edit save path**
   - Save edited content through existing save routes.
   - Assert lifecycle transition to `edited` and updated timestamps.
   - Assert version snapshot still created.

5. **Scheduling compatibility**
   - Create/update schedule.
   - Assert schedule rows in `content_schedules` and run rows in `content_schedule_runs`.
   - Assert linked content reflects scheduled metadata where applicable.

6. **Publish compatibility**
   - Publish/update existing generated site.
   - Assert version snapshots remain queryable and publish metadata unchanged in behavior.

7. **Consolidated retrieval API**
   - Call `GET /api/content?structureId=<id>` as owner.
   - Assert response includes structure/generatedContent/seo/blog/article/schedule/versions/status.

8. **Ownership enforcement**
   - Call retrieval API for another user’s structure.
   - Assert not found/unauthorized behavior and no cross-user data exposure.

9. **Soft archive/delete behavior**
   - Delete website via `/api/websites/delete`.
   - Assert generated content/blog/article rows are soft-deleted (`deleted_at`, `content_status=deleted`).
   - Assert structure management deleted metadata still drives dashboard lifecycle.

10. **Validation guardrails for malformed content**
    - Attempt persisting invalid content package (missing pages/duplicate section keys).
    - Assert explicit storage error and no silent success.

11. **RLS regression check**
    - Validate RLS policies remain enabled and owner scoped after migration.

12. **Index/access path check**
    - Validate common queries use indexes for owner/website/type/status/time/schedule state paths.

## Required project validation

- `npm run lint`
- `npm run build` (with required env from `.env.example`)

## Additional implementation checks

- no raw `process.env` usage in changed non-config files
- no generated-content persistence logic moved to `services/zeroflow`
- retrieval/edit/preview/publish/schedule/version flows remain compatible
