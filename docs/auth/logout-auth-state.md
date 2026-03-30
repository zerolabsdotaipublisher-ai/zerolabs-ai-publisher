# Logout & Authentication State Handling

## Overview

This document describes the logout flow, session state model, redirect rules, UI behavior, and troubleshooting guidance for Zero Labs AI Publisher.

The auth system is built on Supabase and follows a **Layer 1 product app** architecture: all auth state, session lifecycle, and UI behavior are owned here. Supabase is used only as the auth provider — it is never exposed directly to higher-level platform layers.

---

## Session State Model

All session state is centralized in `providers/auth-provider.tsx` via the `AuthProvider`. The `status` field is the single source of truth for auth state across the app.

| Status            | Description                                                                                     |
|-------------------|-------------------------------------------------------------------------------------------------|
| `"loading"`       | Auth state is being resolved (initial render, tab restore, token refresh in progress).          |
| `"authenticated"` | User has a valid, active session.                                                               |
| `"unauthenticated"` | No session present — user has never signed in or explicitly signed out.                       |
| `"expired"`       | A previously active session was revoked, its refresh token expired, or a remote sign-out occurred. |
| `"error"`         | Session state could not be determined due to an unexpected error.                               |

State transitions are driven by Supabase `onAuthStateChange` events and mapped through `deriveSessionStatus()` in `lib/auth/session.ts`.

---

## Logout Flow

### 1. User initiates logout

The user clicks the **Sign out** button rendered in the app header (`components/auth/sign-out-button.tsx`).

### 2. Button enters loading state

- The button is immediately disabled (`disabled={true}`, `aria-busy={true}`)
- Label changes to "Signing out…"
- Duplicate clicks are blocked

### 3. Server-side session invalidation

A `POST /api/auth/sign-out` request is sent to the server. The route handler (`app/api/auth/sign-out/route.ts`) calls `supabase.auth.signOut()` to:
- Invalidate the server-side session cookie
- Revoke the refresh token in Supabase

### 4. Client redirect

On a successful `200` response:
- `router.replace(routes.login)` navigates to `/login` (no back-button history entry)
- `router.refresh()` clears any server-component cache tied to the old session

### 5. Auth state update

Supabase fires a `SIGNED_OUT` event via its internal `BroadcastChannel`. The `onAuthStateChange` listener in `AuthProvider` receives this event and:
- Sets `session` → `null`
- Sets `user` → `null`
- Sets `status` → `"expired"` (if session was previously active) or `"unauthenticated"`

### 6. Error handling

If the `POST /api/auth/sign-out` request fails (network error or non-`200` response):
- An inline error message is displayed below the button: _"Sign out failed. Please try again."_
- The button returns to its normal enabled state
- The user remains on the current page and can retry

---

## Session Expiry Handling

When a session expires outside of an explicit logout (e.g., refresh token rotation failure, admin revocation), the following happens automatically:

1. Supabase fires a `SIGNED_OUT` event via `onAuthStateChange`
2. `AuthProvider` sets `status = "expired"`
3. `SessionGuard` (`components/auth/session-guard.tsx`) detects the status change and calls `router.replace(routes.login)`
4. The user is redirected to the login page without any manual action

The same path applies to `status = "error"` (e.g., network failure during session resolution).

---

## Multi-Tab Sync

Multi-tab sync is handled automatically via Supabase's built-in `BroadcastChannel`. When any tab triggers a sign-out:

1. The signing-out tab completes the logout API call and redirects
2. Supabase broadcasts the `SIGNED_OUT` event to all other open tabs
3. Each tab's `AuthProvider` receives the event via `onAuthStateChange`
4. `SessionGuard` in each tab detects `status = "expired"` and redirects to `/login`

No additional implementation is required — this is a native feature of the Supabase JS client.

---

## Redirect Rules

| Condition                                     | Destination            | Mechanism                                          |
|-----------------------------------------------|------------------------|----------------------------------------------------|
| Unauthenticated user accesses protected route | `/login?next=<path>`   | `middleware.ts` edge redirect                      |
| Unauthenticated user accesses app layout      | `/login?next=<path>`   | `requireUser()` server-side redirect               |
| Session expires or errors (client-side)       | `/login`               | `SessionGuard` client redirect                     |
| Authenticated user accesses `/login`          | `/dashboard`           | Login page server-side redirect                    |
| Authenticated user accesses `/signup`         | `/dashboard`           | Signup page server-side redirect                   |
| Authenticated user accesses `/forgot-password` | `/dashboard`          | Forgot-password page server-side redirect          |
| Successful logout                             | `/login`               | `SignOutButton` → `router.replace(routes.login)`   |

---

## Protected Routes

Protected paths are enforced at two layers:

**Edge layer** (`middleware.ts`):
```ts
const protectedPaths = [routes.dashboard, routes.profile];
```
Unauthenticated requests are redirected to `/login?next=<path>` before the request reaches any server component.

**Server-component layer** (`app/(app)/layout.tsx`):
`requireUser()` is called in the app layout server component. This is a safety net that handles any gaps in the edge matcher (e.g., new routes added before middleware is updated).

---

## Auth-Aware UI

### App layout header

All pages under `app/(app)/` share the app layout, which renders a header containing:
- The authenticated user's email address
- The **Sign out** button

The header is a server component; it receives the user from `requireUser()` and passes it to the layout. The `SignOutButton` is a client component rendered within the header.

### SessionGuard

`SessionGuard` is a zero-output client component rendered in the app layout. It subscribes to `status` from `AuthProvider` and redirects to `/login` when the status becomes `"expired"` or `"error"`.

### Public pages (unauthenticated)

Public layout pages (`/login`, `/signup`, `/forgot-password`) redirect authenticated users to `/dashboard` via a server-side check before rendering.

---

## Initial Auth Resolution (No Flicker)

On first render, `AuthProvider` sets `status = "loading"` synchronously. The `getSession()` call resolves the actual session state before any component that reads `status` is visible:

- App pages are server-rendered with `requireUser()` — the server has already validated the session via the Supabase middleware cookie before the response is sent. No loading flicker occurs on initial load.
- Client-side navigation relies on `AuthProvider` which resolves within the first paint cycle via `getSession()`.
- `SessionGuard` only triggers redirects on `"expired"` or `"error"` — it ignores `"loading"`, preventing premature redirects.

---

## File Reference

| File                                              | Role                                                          |
|---------------------------------------------------|---------------------------------------------------------------|
| `providers/auth-provider.tsx`                     | Single source of truth for auth state; multi-tab sync         |
| `lib/auth/session.ts`                             | `SessionStatus` type; `deriveSessionStatus()` mapping         |
| `components/auth/sign-out-button.tsx`             | Logout button with loading state, error handling, redirect    |
| `components/auth/session-guard.tsx`               | Client guard: redirects on expired/error session              |
| `middleware.ts`                                   | Edge-layer route protection with `next` redirect param        |
| `lib/supabase/auth.ts`                            | `requireUser()` server-side protection helper                 |
| `app/(app)/layout.tsx`                            | Auth-aware app header; renders `SessionGuard`                 |
| `app/api/auth/sign-out/route.ts`                  | Server-side Supabase `signOut()` API handler                  |
| `app/(public)/login/page.tsx`                     | Redirects logged-in users to `/dashboard`                     |
| `app/(public)/signup/page.tsx`                    | Redirects logged-in users to `/dashboard`                     |
| `app/(public)/forgot-password/page.tsx`           | Redirects logged-in users to `/dashboard`                     |
| `config/routes.ts`                                | Centralized route constants                                   |

---

## Troubleshooting

### User sees login page flash on load

Ensure the Supabase middleware cookie is being set correctly. Check `lib/supabase/middleware.ts` — `updateSession()` must run on every request that reaches the app. Verify the `middleware.ts` matcher is not excluding app routes.

### Logout does not redirect in another tab

Verify the Supabase JS client version supports `BroadcastChannel` (v2+). Check browser console for `onAuthStateChange` events. `SessionGuard` must be mounted in the app layout to catch events.

### Sign-out button shows error after click

The `POST /api/auth/sign-out` request failed. Check network connectivity and server logs. The user can click the button again to retry. If the error persists, clearing browser cookies and navigating to `/login` will also end the session locally.

### Protected page accessible after logout

Ensure `middleware.ts` includes the path in `protectedPaths`. Also verify the Supabase session cookie is being cleared by the sign-out API. Hard-refresh (`Ctrl+Shift+R`) to bypass any browser cache.

### `status` stays `"loading"` indefinitely

This indicates `getSession()` never resolved in `AuthProvider`. Check for JavaScript errors in the browser console. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correctly set.
