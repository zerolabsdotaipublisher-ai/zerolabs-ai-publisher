# Instagram Publishing Integration (ZLAP-STORY 7-3)

This story adds Instagram Business/Creator publishing inside AI Publisher using Instagram Graph API architecture.

## Architecture alignment

- Instagram publishing logic is implemented in AI Publisher (`lib/social/instagram/*`, `app/api/social/instagram/*`).
- No social publishing domain logic is introduced in `services/zeroflow`.
- Existing social post generation from Story 7-2 is reused via `social_posts` + platform variants.
- Existing scheduler execution entry (`/api/schedules/execute`) is reused to process due Instagram publish jobs.

## MVP scope

### In scope

- OAuth connect/callback/disconnect routes for Instagram account linking via Meta OAuth flow.
- Encrypted access token storage (AES-256-GCM) using `JWT_SECRET` as the current encryption boundary.
- Instagram image publishing flow:
  1. Create media container
  2. Publish media container
- Caption formatting from generated Instagram variant (caption + CTA + hashtags).
- Media URL preflight validation and Instagram content constraints.
- Publish lifecycle states:
  - `draft`, `pending`, `uploading`, `publishing`, `published`, `failed`, `retry_pending`, `canceled`
- Retry handling and throttle-aware retry scheduling for retryable errors.
- Owner-scoped access control and RLS for connections/jobs/attempts.
- Structured logging and metrics integration.

### Out of scope for this MVP

- Carousel publishing
- Reels/video publishing
- Multi-account team orchestration
- Cross-platform campaign orchestration
- Dedicated social worker fleet separate from current scheduler execution endpoint

## Meta Developer App and permissions

Required server configuration:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `INSTAGRAM_GRAPH_API_VERSION`

OAuth scopes requested for the integration:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

## Data model

Migration: `supabase/migrations/20260429010000_instagram_publishing.sql`

- `social_account_connections`
  - owner, platform, connection state, OAuth state, Instagram account metadata, token lifecycle metadata
  - encrypted token storage column (`encrypted_access_token`)
- `social_publish_jobs`
  - owner, social post reference, lifecycle status, scheduled timing, provider IDs, retry metadata
- `social_publish_attempts`
  - per-attempt execution tracking, retryability, error and provider response metadata
- `claim_due_social_publish_jobs(...)`
  - due-job claim function for scheduler-triggered execution

## Scheduling integration

`app/api/schedules/execute/route.ts` now executes both:

- content schedules (`executeDueContentSchedules`)
- due Instagram publish jobs (`executeDueInstagramPublishJobs`)

No second scheduler is introduced.

## Task-to-file mapping (all 17 tasks)

1. Define Instagram Publishing Requirements  
   - `docs/social/instagram-publishing-integration.md`
2. Configure Meta Developer App and Permissions  
   - `config/env.ts`, `config/services.ts`, `.env.example`, `docs/social/instagram-publishing-integration.md`
3. Implement Instagram Account Connection Flow  
   - `lib/social/instagram/oauth.ts`, `lib/social/instagram/storage.ts`, `app/api/social/instagram/connect/route.ts`, `app/api/social/instagram/callback/route.ts`, `app/api/social/instagram/disconnect/route.ts`
4. Implement Access Token Storage and Management  
   - `lib/social/instagram/storage.ts`, `supabase/migrations/20260429010000_instagram_publishing.sql`
5. Implement Instagram Media Upload Workflow  
   - `lib/social/instagram/media.ts`, `lib/social/instagram/publish.ts`
6. Implement Caption and Content Formatting  
   - `lib/social/instagram/validation.ts`, `lib/social/instagram/publish.ts`
7. Implement Instagram Post Publishing Logic  
   - `lib/social/instagram/publish.ts`, `app/api/social/instagram/publish/route.ts`
8. Integrate Instagram Publishing with Scheduling System  
   - `lib/social/instagram/publish.ts`, `app/api/schedules/execute/route.ts`
9. Implement Publish Status Tracking  
   - `lib/social/instagram/types.ts`, `lib/social/instagram/storage.ts`, `app/api/social/instagram/status/route.ts`, `supabase/migrations/20260429010000_instagram_publishing.sql`
10. Implement Error Handling and Retry Logic  
   - `lib/social/instagram/errors.ts`, `lib/social/instagram/publish.ts`, `lib/social/instagram/media.ts`
11. Implement Rate Limit and Throttling Handling  
   - `lib/social/instagram/media.ts`, `lib/social/instagram/publish.ts`
12. Implement Media Validation and Constraints  
   - `lib/social/instagram/validation.ts`
13. Implement Access Control and Permissions  
   - `app/api/social/instagram/*.ts`, `supabase/migrations/20260429010000_instagram_publishing.sql`
14. Implement Logging and Monitoring for Instagram Publishing  
   - `lib/social/instagram/storage.ts`, `lib/social/instagram/publish.ts`
15. Integrate Instagram Publishing with Content Generation System  
   - `app/api/social/instagram/publish/route.ts` (reuses `getSocialPostById` generated variants)
16. Test Instagram Publishing Integration  
   - `docs/social/instagram-publishing-tests.md`
17. Document Instagram Publishing Integration  
   - `docs/social/instagram-publishing-integration.md`
