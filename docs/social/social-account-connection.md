# Social Media Account Connection (ZLAP-STORY 7-6)

This story implements AI Publisher-owned social account connection management with Instagram-first OAuth support and a future-ready provider model.

## Architecture alignment

- Social account connection logic is implemented inside AI Publisher (`lib/social/accounts/*`, `app/api/social/accounts/*`, `components/social/*`).
- No account connection logic is moved to `services/zeroflow`.
- Existing Instagram OAuth/token logic from Story 7-3 is reused by `lib/social/accounts/oauth.ts`.
- Existing social publishing, scheduling, and history systems are reused through the same `social_account_connections` storage and Instagram publish workflows.
- No raw `process.env` usage was added outside config modules.

## MVP boundaries

### In scope

- Instagram OAuth connect/callback/list/view/refresh/disconnect lifecycle.
- Provider registry model for `instagram`, `facebook`, `linkedin`, `x` with Instagram as the only enabled MVP provider.
- Owner-scoped account access APIs and UI management panel.
- Token exchange, encrypted token persistence, token refresh, and reauthorization status handling.
- Status tracking states used by the account manager:
  - `connecting`
  - `connected`
  - `disconnected`
  - `expired`
  - `invalid`
  - `reauthorization_required`
- Integration with existing Instagram publish + social schedule execution + social history references.

### Out of scope for this MVP

- Live OAuth or publishing adapters for Facebook, LinkedIn, and X.
- Multi-account team orchestration.
- Dedicated background worker for proactive refresh outside current execution flows.

## Data model and storage notes

- Existing table `social_account_connections` is extended for provider-agnostic account fields:
  - `platform_account_id`
  - `account_display_name`
  - `account_username`
  - `profile_url`
  - `profile_picture_url`
  - `token_reference`
  - `last_connected_at`
- Existing encrypted token column (`encrypted_access_token`) is reused.
- Current encryption boundary remains `JWT_SECRET` (AES-256-GCM, server-side only).
- Existing Instagram-specific columns (`instagram_account_id`, `instagram_username`, `facebook_page_id`) remain populated for Story 7-3 publish compatibility.

## Error handling implemented

- Permission denied callback (`error` / `error_description`) handled.
- Invalid callback payload (`code/state` missing) handled.
- Invalid/expired OAuth state handled.
- Token exchange/refresh failures normalized and surfaced with status updates.
- Unsupported provider requests return explicit unsupported/provider-not-enabled errors.

## Logging and monitoring

- Structured logs and timings are emitted for:
  - connect start
  - callback success/failure
  - refresh success/failure
  - disconnect
- Existing observability primitives are reused (`logger`, `metrics`).

## Task-to-file mapping (all 17 tasks)

1. Define Social Account Connection Requirements  
   - `lib/social/accounts/schema.ts`, `docs/social/social-account-connection.md`
2. Design Social Account Domain Model  
   - `lib/social/accounts/types.ts`, `lib/social/accounts/schema.ts`
3. Configure Developer Applications for Each Platform  
   - `lib/social/accounts/providers.ts`, `lib/social/accounts/oauth.ts`, `docs/social/social-account-connection.md`
4. Implement OAuth Authorization Flow  
   - `lib/social/accounts/oauth.ts`, `lib/social/accounts/workflow.ts`, `app/api/social/accounts/connect/[platform]/route.ts`
5. Implement Token Exchange and Storage  
   - `lib/social/accounts/oauth.ts`, `lib/social/accounts/tokens.ts`, `lib/social/accounts/storage.ts`
6. Implement Account Retrieval and Mapping  
   - `lib/social/accounts/oauth.ts`, `lib/social/accounts/storage.ts`
7. Implement Account Connection Persistence  
   - `lib/social/accounts/storage.ts`, `supabase/migrations/20260503190000_social_account_connections_generalization.sql`
8. Implement Account Connection Status Tracking  
   - `lib/social/accounts/types.ts`, `lib/social/accounts/validation.ts`, `lib/social/accounts/storage.ts`, `lib/social/accounts/workflow.ts`
9. Implement Token Refresh and Reauthorization Logic  
   - `lib/social/accounts/oauth.ts`, `lib/social/accounts/storage.ts`, `lib/social/accounts/workflow.ts`, `app/api/social/accounts/[accountId]/refresh/route.ts`
10. Implement Account Disconnection Flow  
   - `lib/social/accounts/workflow.ts`, `lib/social/accounts/storage.ts`, `app/api/social/accounts/[accountId]/disconnect/route.ts`
11. Implement Access Control for Account Management  
   - `app/api/social/accounts/*.ts`, `app/api/social/accounts/[accountId]/*.ts`, `supabase/migrations/20260503190000_social_account_connections_generalization.sql`
12. Implement UI for Account Connection and Management  
   - `components/social/social-account-manager.tsx`, `components/social/social-account-card.tsx`, `components/social/social-schedule-panel.tsx`, `app/(app)/generated-sites/[id]/page.tsx`, `app/globals.css`
13. Implement Error Handling for Account Connection  
   - `lib/social/accounts/validation.ts`, `lib/social/accounts/workflow.ts`, `app/api/social/accounts/callback/[platform]/route.ts`
14. Implement Logging and Monitoring for Account Connections  
   - `lib/social/accounts/workflow.ts`
15. Integrate Account Connection with Publishing System  
   - `app/api/social/instagram/publish/route.ts`, `lib/social/scheduling/workflow.ts`, `app/api/social/instagram/status/route.ts`, `app/api/social/instagram/connect/route.ts`, `app/api/social/instagram/callback/route.ts`, `app/api/social/instagram/disconnect/route.ts`
16. Test Social Media Account Connection Across Platforms  
   - `lib/social/accounts/scenarios.ts`, `docs/social/social-account-connection-tests.md`
17. Document Social Media Account Connection System  
   - `docs/social/social-account-connection.md`, `docs/social/social-account-connection-tests.md`
