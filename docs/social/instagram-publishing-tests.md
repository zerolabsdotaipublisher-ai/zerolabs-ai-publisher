# Instagram Publishing Integration Test Matrix

## Validation commands

1. `npm run lint`
2. `npm run build` (with required env values populated)

## Manual integration scenarios

1. **Connect flow success**
   - Authenticate as owner user.
   - `GET /api/social/instagram/connect`.
   - Complete Meta OAuth and callback.
   - Verify `social_account_connections` row is `connected` with account metadata.
2. **Connect flow state mismatch**
   - Trigger callback with invalid/expired `state`.
   - Verify callback fails and connection remains safe.
3. **Disconnect flow**
   - `POST /api/social/instagram/disconnect`.
   - Verify connection status moves to `disconnected` and token is cleared.
4. **Immediate publish success**
   - Use existing Story 7-2 generated social post that includes Instagram variant and image URL.
   - `POST /api/social/instagram/publish` with `postId`.
   - Verify lifecycle transitions to `published`.
5. **Scheduled publish path**
   - `POST /api/social/instagram/publish` with future `scheduledFor`.
   - Trigger `/api/schedules/execute` with scheduler bearer token.
   - Verify due job is claimed and processed.
6. **Media validation errors**
   - Missing media URL.
   - Unsupported media URL extension.
   - Oversized caption/hashtag violations.
   - Verify route returns validation-driven failure.
7. **Retry and throttling behavior**
   - Simulate Graph API 429/5xx.
   - Verify job moves to `retry_pending` with `next_attempt_at`.
   - Verify retry exhaustion moves job to `failed`.
8. **Owner access control**
   - Attempt to read/publish/disconnect with another user.
   - Verify unauthorized or not-found behavior due to owner scoping.
9. **Status tracking**
   - `GET /api/social/instagram/status` and `GET /api/social/instagram/status?jobId=...`
   - Verify connection and job status payloads align with DB rows.

## Boundary checks

- Verify no Instagram publishing logic exists under `services/zeroflow`.
- Verify no raw `process.env` usage outside `config/env.ts` and `config/services.ts`.
- Verify scheduler integration reuses existing `/api/schedules/execute` path and does not add a separate scheduler.
