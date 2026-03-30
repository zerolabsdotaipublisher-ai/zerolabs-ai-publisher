# Session Management (ZLAP-STORY 2-3)

This document defines the full session lifecycle for Zero Labs AI Publisher.
It is the canonical reference for session behavior and is cross-linked from
[Supabase Authentication Foundation](./supabase-auth.md).

## Layer Architecture

Zero Labs AI Publisher is a **Layer 1 product app**. All session management
belongs inside this application and uses Supabase as the auth/session backend.
Session state must not be coupled to shared platform or infrastructure layers.

---

## 1. Session Lifecycle

```
User visits app
      │
      ▼
Middleware (middleware.ts)
  └─ updateSession() refreshes server-side session cookie on every request
      │
      ▼
AppLayout / AuthProvider (providers/auth-provider.tsx)
  └─ getSession() restores session from in-memory Supabase client
  └─ onAuthStateChange() subscribes to real-time auth events
      │
      ├─ session present ──► status: "authenticated"
      └─ no session    ──► status: "unauthenticated"
              │
              ▼ user signs in
      Supabase issues session (JWT + refresh token)
              │
              ▼ token nears expiry (< 60 s remaining)
      Supabase auto-refreshes token → TOKEN_REFRESHED event
              │
              ▼ refresh token expired / revoked
      SIGNED_OUT event → status: "expired"
              │
              ▼ user or app signs out
      /api/auth/sign-out → supabase.auth.signOut()
      SIGNED_OUT event → status: "unauthenticated"
      Router redirects to /login
```

### Lifecycle States

| State             | Meaning                                                         |
| ----------------- | --------------------------------------------------------------- |
| `"loading"`       | Auth state is being resolved (initial render, tab restore)      |
| `"authenticated"` | User has a valid, active session                                |
| `"unauthenticated"` | No session — never signed in or explicitly signed out         |
| `"expired"`       | A prior session was revoked or its refresh token expired        |
| `"error"`         | Unexpected error during session resolution                      |

These states are exposed on `AuthContextValue.status` from `providers/auth-provider.tsx`.

---

## 2. Session Storage Strategy

| Layer         | Mechanism                                                      |
| ------------- | -------------------------------------------------------------- |
| Browser       | HTTP-only cookies managed by `@supabase/ssr`                   |
| Server (SSR)  | Cookies read from `next/headers` via `lib/supabase/server.ts`  |
| Middleware    | Cookies read/written via `lib/supabase/middleware.ts`           |
| Client state  | In-memory React state in `providers/auth-provider.tsx`         |

Supabase SSR stores the access token and refresh token in HTTP-only, Secure,
`SameSite=Lax` cookies. No custom `localStorage` persistence is used. This
aligns with Next.js App Router conventions and Supabase's recommended SSR
pattern.

The `updateSession()` call in `middleware.ts` ensures cookies are refreshed on
every server request before route handlers run, keeping the server-side session
always current.

---

## 3. Centralized Session Provider

**File:** `providers/auth-provider.tsx`

The `AuthProvider` component is the single source of truth for client-side
session state. It exposes:

```ts
type AuthContextValue = {
  session: Session | null;      // Raw Supabase Session object
  user: User | null;            // Authenticated user
  loading: boolean;             // True during initial resolution
  status: SessionStatus;        // Granular session status
  error: string | null;         // Error message when status === "error"
  refreshSession: () => Promise<void>; // Manual session refresh
};
```

Consume via:

```tsx
import { useAuth } from "@/providers/auth-provider";

function MyComponent() {
  const { user, status, loading } = useAuth();

  if (status === "loading") return <Spinner />;
  if (status === "expired") return <SessionExpiredBanner />;
  if (!user) return null;

  return <div>Hello, {user.email}</div>;
}
```

---

## 4. Session Restore on Application Load

On mount, `AuthProvider` calls `supabase.auth.getSession()` to restore the
session from the Supabase in-memory client, which is populated from the cookies
set by the server. This covers:

- First load
- Browser page refresh
- Returning visit (session cookie still valid)
- Tab reopen (session cookie still valid)

The `loading` flag is `true` until this async call resolves, preventing
premature redirect or render of protected UI.

---

## 5. Session Refresh Handling

Token refresh is handled at two layers:

1. **Middleware (server-side):** `updateSession()` in `lib/supabase/middleware.ts`
   is called on every server request. If the access token is expired but the
   refresh token is valid, Supabase automatically issues a new access token and
   updates the cookies in the response.

2. **Client-side:** `supabase.auth.onAuthStateChange()` fires a `TOKEN_REFRESHED`
   event when Supabase's built-in auto-refresh runs. The provider updates
   `session` and sets `status: "authenticated"`.

The `refreshSession()` method in the provider calls
`supabase.auth.refreshSession()` explicitly. This is available for UI-triggered
refresh scenarios (e.g., after a network error recovery).

---

## 6. Session Expiration Handling

When a session's refresh token is expired or revoked:

1. Supabase fires a `SIGNED_OUT` auth change event.
2. The provider detects that a session was previously active (`hadSessionRef.current === true`).
3. `status` is set to `"expired"`.
4. `session` and `user` are cleared.

UI components that observe `status === "expired"` can render a contextual
message (e.g., "Your session has expired. Please sign in again.") rather than
silently redirecting.

Protected routes are guarded by both the middleware and `lib/supabase/auth.ts`
(`requireUser()`). An expired session returns `null` from `getServerUser()`,
triggering a redirect to `/login`.

---

## 7. Logout / Session Revocation

Logout follows this flow:

1. `SignOutButton` calls `POST /api/auth/sign-out` (disabling the button while
   the request is in flight to prevent double-submission).
2. `app/api/auth/sign-out/route.ts` calls `supabase.auth.signOut()`, which
   revokes the session server-side and clears the session cookie.
3. On success, the client calls `router.replace(routes.login)` and
   `router.refresh()` to clear server-side cache.
4. The `SIGNED_OUT` event propagates to all open tabs via Supabase's
   `BroadcastChannel`, updating `status` to `"expired"` in those tabs.

---

## 8. Protected Route Enforcement

Two layers of protection exist:

| Layer      | File                              | Behavior                                            |
| ---------- | --------------------------------- | --------------------------------------------------- |
| Middleware | `middleware.ts`                   | Redirects unauthenticated requests to `/login?next` |
| Layout     | `app/(app)/layout.tsx`            | Server-side `requireUser()` guard for all app pages |

The `?next` parameter preserves the intended destination for post-login redirect.
A `resolveSafeNextPath()` helper (`lib/auth/redirect.ts`) validates the path to
prevent open-redirect attacks.

---

## 9. Public / Private Layout Behavior

| Route group      | Auth requirement | Behavior when authenticated                  |
| ---------------- | ---------------- | -------------------------------------------- |
| `app/(public)/*` | None             | Login/signup pages redirect to `/dashboard` if a valid session is present |
| `app/(app)/*`    | Required         | `requireUser()` redirects to `/login` if no session |

This prevents authenticated users from seeing the login form and prevents
unauthenticated users from accessing app pages.

---

## 10. Idle / Inactive Session Behavior

At current scope, idle session timeout is **provider-managed** — Supabase
controls token expiry (default: 3600 s access token, 604 800 s refresh token).
No forced client-side idle timer is implemented.

When the Supabase-managed session expires, the `SIGNED_OUT` event fires,
setting `status: "expired"` as described in Section 6.

If a forced idle timeout becomes a product requirement in a later story, the
recommended approach is:

1. Track `lastActivity` via `pointermove` / `keydown` event listeners.
2. Use a `setTimeout` (or `requestIdleCallback`) to fire a warning at
   `idleWarningThreshold` seconds.
3. Call `supabase.auth.signOut()` at `idleTimeoutThreshold` seconds.
4. Clear all state and redirect to `/login?reason=idle`.

---

## 11. Multi-Tab Session Synchronization

Supabase uses the browser's `BroadcastChannel` API internally. When a
`SIGNED_IN`, `SIGNED_OUT`, or `TOKEN_REFRESHED` event occurs in any tab, the
same event fires in all other tabs that have an active `onAuthStateChange`
listener.

The `AuthProvider` subscribes to `onAuthStateChange` on mount and
unsubscribes on unmount. This means:

- Logging out in Tab A automatically updates `status` to `"expired"` in Tab B.
- Logging in via a different tab refreshes auth state across all tabs.
- Token refresh is shared — only one tab actually calls the refresh endpoint.

No additional `storage` event listeners or service workers are needed for
basic multi-tab sync.

---

## 12. Session Loading and Transition States

The `loading` flag in `AuthContext` is `true` from provider mount until the
first `getSession()` resolves. Use this to:

- Prevent protected UI from rendering before auth is known.
- Prevent redirects from firing before auth is resolved.
- Show a neutral loading indicator during the auth resolution window.

Example pattern:

```tsx
function ProtectedPage() {
  const { status } = useAuth();

  if (status === "loading") return <PageSkeleton />;

  return <DashboardContent />;
}
```

The `status === "expired"` state can be used to show an expiry notice instead
of a blank redirect, improving perceived UX.

---

## 13. Session Error Handling

| Scenario                          | Provider Response                                |
| --------------------------------- | ------------------------------------------------ |
| `getSession()` throws             | `status: "error"`, `error: "Failed to restore session. Please sign in."` |
| `refreshSession()` returns error  | `status: "expired"` or `"unauthenticated"`; error cleared |
| `refreshSession()` throws         | `status: "error"`, `error: "Session refresh failed. Please sign in again."` |

When `status === "error"`, the app should prompt the user to sign in again.
Clearing bad state is automatic — the provider sets `session: null` and
`user: null` before surfacing the error status.

---

## 14. Backend Access Control Alignment

All API routes that require authentication use `getServerUser()` from
`lib/supabase/server.ts` to validate the server-side session. The Supabase
Row Level Security (RLS) policies ensure that database access is scoped to the
authenticated user regardless of what the frontend claims.

| Frontend state      | Backend behavior                                        |
| ------------------- | ------------------------------------------------------- |
| `authenticated`     | Server reads valid session from cookie; RLS allows      |
| `unauthenticated`   | `getServerUser()` returns `null`; routes return 401     |
| `expired`           | Cookie is invalid/missing; `getServerUser()` returns `null` |

The `/api/auth/profile-sync` route checks for a valid server-side user before
syncing. The `/api/auth/sign-out` route uses the server-side Supabase client to
ensure cookies are properly cleared at the server level.

---

## 15. Testing and Validation

### Local Validation Steps

1. Copy `.env.example` to `.env.local` and fill in all required values.
2. Run `npm install && npm run lint && npm run build`.
3. Run `npm run dev` and verify:

| Scenario                            | Expected behavior                                      |
| ----------------------------------- | ------------------------------------------------------ |
| Visit `/dashboard` unauthenticated  | Redirected to `/login?next=/dashboard`                 |
| Sign in                             | Redirected to `/dashboard`; `status: "authenticated"` |
| Refresh browser on `/dashboard`     | Session restored; no redirect to login                 |
| Sign out via `SignOutButton`        | Redirected to `/login`; `status: "unauthenticated"`   |
| Sign out in Tab A, observe Tab B    | Tab B status updates to `"expired"` via BroadcastChannel |
| Visit `/login` while authenticated  | Redirected to `/dashboard`                             |
| Simulate expired token (delete cookie) | Next request redirected to `/login`                 |

### Deployed Validation Steps

Repeat the above steps in the Vercel preview deployment with production env vars.
Verify:

- Session cookie is `Secure` and `SameSite=Lax` in production.
- `updateSession()` in middleware refreshes cookies on each request.
- Sign-out clears cookies and redirects correctly.
- OAuth callback (`/auth/callback`) exchanges code, syncs profile, and redirects to `/dashboard`.

---

## 16. Implementation Map

| Task | File(s) |
| ---- | ------- |
| Session status type | `lib/auth/session.ts` |
| Centralized provider / state | `providers/auth-provider.tsx` |
| Session restore on load | `providers/auth-provider.tsx` (getSession on mount) |
| Token refresh | `lib/supabase/middleware.ts`, `providers/auth-provider.tsx` (TOKEN_REFRESHED) |
| Expiration handling | `providers/auth-provider.tsx` (SIGNED_OUT + hadSession) |
| Logout / revocation | `app/api/auth/sign-out/route.ts`, `components/auth/sign-out-button.tsx` |
| Protected route enforcement | `middleware.ts`, `app/(app)/layout.tsx`, `lib/supabase/auth.ts` |
| Public/private layout | `app/(public)/login/page.tsx`, `app/(app)/layout.tsx` |
| Idle behavior | Documented here (provider-managed at current scope) |
| Multi-tab sync | `providers/auth-provider.tsx` (onAuthStateChange via BroadcastChannel) |
| Loading states | `providers/auth-provider.tsx` (`loading`, `status`) |
| Error recovery | `providers/auth-provider.tsx` (`status: "error"`, `error` field) |
| Backend alignment | `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, all API auth routes |
| Session storage strategy | Supabase SSR cookies — see Section 2 |
| Testing validation | Section 15 above |
| Architecture documentation | This document |
