# Social Media Account Connection Test Scenarios (ZLAP-STORY 7-6)

## Validation commands

1. `npm run lint`
2. `npm run build`

## Core account connection scenarios

1. Owner opens `GET /api/social/accounts/connect/instagram` and is redirected to Meta OAuth.
2. Callback success (`GET /api/social/accounts/callback/instagram`) writes a connected account with mapped profile metadata.
3. Callback denied permission returns actionable error and marks account for reauthorization.
4. Callback with missing/invalid state fails.
5. Callback with expired stored state fails.
6. `GET /api/social/accounts` returns owner-scoped account list and provider capability metadata.
7. `GET /api/social/accounts/[accountId]` returns owner-scoped account detail.

## Token and status scenarios

8. `POST /api/social/accounts/[accountId]/refresh` refreshes token and updates refresh timestamps.
9. Refresh failure transitions account to `reauthorization_required`.
10. Expired token is surfaced as non-connected in publishing account checks.
11. `POST /api/social/accounts/[accountId]/disconnect` clears token material and marks `disconnected`.

## UI scenarios

12. Social account manager renders connected accounts and status badges.
13. Connect button launches provider OAuth flow.
14. Refresh/Reauthorize action updates account state.
15. Disconnect action updates account state.

## Integration scenarios

16. Instagram publish API uses account connection state from unified account workflow.
17. Social scheduling execution uses account connection state from unified account workflow.
18. Instagram status API resolves connection through unified account workflow.

## Regression checks

19. No social account connection logic exists under `services/zeroflow`.
20. No raw `process.env` usage was added outside `config/env.ts` and `config/services.ts`.
21. Existing social publishing, scheduling, and history flows still rely on shared social connection storage.
22. Provider model remains future-ready for Facebook, LinkedIn, and X, with Instagram-only MVP enablement.
