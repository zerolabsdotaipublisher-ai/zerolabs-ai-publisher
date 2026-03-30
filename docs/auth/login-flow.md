# Login Flow (ZLAP-STORY 2-2)

This document defines the login flow for Zero Labs AI Publisher.
It extends the Supabase auth foundation established in ZLAP-STORY 2-0 and the registration refinements from ZLAP-STORY 2-1. It is the authoritative reference for login requirements, validation rules, redirect logic, success/error states, and testing guidance.

See also: [Supabase Auth Foundation](./supabase-auth.md) · [Registration Flow](./registration-flow.md)

---

## Login Requirements (Task 1)

### Scope

- Email + password login only (OAuth not in scope for this story).
- Email verification is enforced by Supabase: unconfirmed accounts return an explicit error.
- `public.profiles` is synced on each login via `AuthProvider` (`/api/auth/profile-sync`).

### Required Fields (MVP)

| Field    | Type     | Required | Constraints                                     |
| -------- | -------- | -------- | ----------------------------------------------- |
| Email    | email    | Yes      | Valid email format, trimmed before submission   |
| Password | password | Yes      | Non-empty; no minimum enforced at login         |

No social login, magic link, or additional fields are in scope for MVP.

### Session Persistence

- Supabase stores the session in a browser cookie (`sb-*` cookies).
- `AuthProvider` calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange` to keep the client-side session context current.
- `lib/supabase/middleware.ts` calls `updateSession()` on every request to refresh the server-side session cookie silently.
- The middleware matcher covers all routes except `api`, `_next/static`, `_next/image`, and `favicon.ico`.
- Returning visits restore the session automatically from the cookie without requiring the user to sign in again.

### Redirect Behavior

| Scenario                                   | Destination                                      |
| ------------------------------------------ | ------------------------------------------------ |
| Successful login (no `next` param)         | `/dashboard`                                     |
| Successful login (with `?next=/some/path`) | `/some/path` (protected route preserved)         |
| Successful login (`next` is external/invalid) | `/dashboard` (invalid return target ignored)   |
| Authenticated user visits `/login`         | Redirected to `/dashboard` (server-side check)   |
| Unauthenticated user visits protected page | Redirected to `/login?next=<intended-path>`      |

### Protected-Route Return Behavior

When an unauthenticated user attempts to access a protected page:

1. `middleware.ts` intercepts the request.
2. The user is redirected to `/login?next=<intended-path>`.
3. After successful login, `SignInForm` reads `searchParams.get("next")` and calls `router.replace(nextPath)`.
4. The user arrives at the originally intended page.

`next` must be an internal app path (`/something`). Any absolute URL, protocol-relative URL (`//...`), or malformed value falls back to `/dashboard`.

---

## Login Form Structure (Task 2)

Fields are rendered in this order:

1. **Email** — `type="email"`, required, `autoComplete="email"`, `aria-required="true"`
2. **Password** — `type="password"`, required, `autoComplete="current-password"`, `aria-required="true"`

Below the fields:

- Error message (conditional, `role="alert"`)
- Success / info message (conditional, `role="status"`)
- Submit button (`disabled` + `aria-busy` during submission)
- SR-only live region for loading state announcements

Below the form (in `LoginPage`):

- "Create account" link → `/signup`
- "Forgot password?" link → `/forgot-password`

No terms notice is needed for the login form (it is shown only at registration).

---

## Login Page UI (Task 3)

**File:** `app/(public)/login/page.tsx`

- Exports `metadata` (`title: "Sign In"`, `description`).
- Performs a server-side authenticated-user check: if a session exists, redirects to `/dashboard` before rendering.
- Wraps `SignInForm` in a `Suspense` boundary (required because the form reads `useSearchParams()`).
- Renders navigation links ("Create account", "Forgot password?") outside the form.

---

## Client-Side Validation Rules (Task 4)

Validation runs on form submit before any network request. Rules in order:

1. Email must not be empty → "Email is required."
2. Email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → "Please enter a valid email address."
3. Password must not be empty → "Password is required."

Validation stops at the first failing rule and displays a single human-readable error message in a `<p role="alert">` element. The form uses `noValidate` to suppress browser-native validation UI.

---

## Login Submission (Task 5)

Submission calls `supabase.auth.signInWithPassword()` via the browser client:

```ts
supabase.auth.signInWithPassword({
  email: email.trim(),
  password,
});
```

The email is trimmed before submission. The raw Supabase error message is mapped to a user-friendly string by `mapSignInError()` before display. On success, the user is redirected to `nextPath` using `router.replace()` + `router.refresh()`.

---

## Session Initialization and Persistence (Task 6)

Session lifecycle is fully handled by the Story 2-0 foundation. No new infrastructure is needed.

**After successful login:**

1. Supabase sets a `sb-*` session cookie.
2. `router.refresh()` causes the server to re-render with the new session.
3. `AuthProvider.onAuthStateChange` fires, updating client-side session state.
4. `AuthProvider` calls `POST /api/auth/profile-sync` to refresh the profile row.

**Session refresh:** `lib/supabase/middleware.ts` calls `supabase.auth.getUser()` on every server request, silently refreshing the cookie before expiry. No explicit session-refresh call is needed in the login flow.

**Returning visits:** The session cookie persists until expiry. When the user revisits the app, `AuthProvider.getSession()` on mount restores the client-side state, and the middleware refreshes the cookie server-side.

---

## Login Success States (Task 7)

| Condition                         | Outcome                                                                     |
| --------------------------------- | --------------------------------------------------------------------------- |
| Login succeeds, no `next` param   | Redirected to `/dashboard`                                                  |
| Login succeeds, `next` param set  | Redirected to the preserved `next` path                                     |
| Login page loaded with `check_email` message | Inline success message: "Account created. Check your email to confirm your account, then sign in." |

The "check\_email" message originates from the registration flow and confirms to the user that they must verify their email before signing in. It is displayed as a `<p role="status">` element so screen readers announce it politely.

---

## Login Error States (Task 8)

All Supabase error messages are mapped to user-friendly strings before display.

| Supabase error                                | User-facing message                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| "Invalid login credentials"                   | "Invalid email or password. Please try again."                           |
| "Email not confirmed"                         | "Your email has not been confirmed. Check your inbox for the confirmation link." |
| "Too many requests" / rate limit              | "Too many sign-in attempts. Please wait a moment and try again."         |
| `error=callback_failed` (URL param)           | "Authentication failed. Please try signing in again."                    |
| Any other Supabase error                      | "Something went wrong. Please try again."                                |

Client-side validation errors (before network call):

| Rule violated         | Message                               |
| --------------------- | ------------------------------------- |
| Empty email           | "Email is required."                  |
| Invalid email format  | "Please enter a valid email address." |
| Empty password        | "Password is required."               |

Errors are displayed in a `<p id="…-error" role="alert">` element so screen readers announce them immediately.

---

## Forgot Password Entry Point (Task 9)

The login page (`app/(public)/login/page.tsx`) includes a visible "Forgot password?" link pointing to `/forgot-password` (`routes.forgotPassword`). The link is outside the form in the `auth-link-row` paragraph, consistently positioned below the submit button area.

The forgot-password route and reset-password route are unchanged from Story 2-0.

---

## Redirect Logic for Protected Routes (Task 10)

The existing middleware and `requireUser()` helper fully implement this behaviour:

```
Unauthenticated user → /dashboard
  ↓ middleware intercepts
  → /login?next=/dashboard
    ↓ user signs in
    → /dashboard   (router.replace(nextPath))
```

**Files involved:**

- `middleware.ts` — appends `?next=<path>` when redirecting to `/login`
- `components/auth/sign-in-form.tsx` — reads `searchParams.get("next")` and redirects there on success
- `lib/supabase/auth.ts` (`requireUser`) — server-side guard used by `app/(app)/layout.tsx`

No changes are needed to this infrastructure; it is validated as part of this story.

---

## Loading and Submission States (Task 11)

- The submit button is disabled while `isSubmitting` is `true`.
- The button label changes from "Sign in" to "Signing in…" during submission.
- `aria-busy={isSubmitting}` is set on the button for screen-reader announcements.
- A SR-only `<span aria-live="polite" aria-atomic="true">` announces "Signing in, please wait." during submission.
- Duplicate submissions are prevented because the button is disabled until the request resolves.

---

## Auth-Aware Navigation and UI (Task 12)

**Login page redirect for authenticated users:**

`app/(public)/login/page.tsx` calls `getServerUser()` at render time. If a session exists, it redirects to `/dashboard` before returning any HTML. This prevents authenticated users from seeing the login form unnecessarily.

**App shell:**

- The `app/(app)/layout.tsx` calls `requireUser()`, which redirects to `/login` if no session is found.
- The `app/(public)/layout.tsx` is a plain layout with no auth-state logic (auth state is handled per-page).
- `AuthProvider` provides `{ session, user, loading }` to all client components for auth-aware rendering where needed.

No additional navigation component changes are required for MVP; the current layout structure already enforces the authenticated/public separation.

---

## Accessibility and UX (Task 13)

The sign-in form implements the following accessibility requirements:

- Each `<input>` has a unique `id` (generated via React `useId()`).
- Each `<label>` uses `htmlFor` referencing the matching input `id`.
- Required fields are marked with `aria-required="true"`.
- Error messages use `role="alert"` for immediate screen-reader announcement.
- Info/success messages use `role="status"` for polite announcements.
- When an error is present, `aria-describedby` on inputs points to the error element's `id`.
- The form uses `noValidate` to suppress browser-native validation in favour of custom UX.
- The submit button is disabled during submission (`disabled`, `aria-busy`).
- A SR-only `aria-live="polite"` region announces the submission state.
- `autoComplete` attributes guide password managers (`email`, `current-password`).
- The layout is a single-column flex column, readable on mobile at any viewport width.
- The "Forgot password?" link is visibly positioned and keyboard-navigable.

---

## Testing Guidance (Task 14)

### Local Testing

1. Copy `.env.example` to `.env.local` and fill in all required values.
2. Run `npm install && npm run dev`.
3. Visit `http://localhost:3000/login`.

**Happy path:**

- Sign in with a valid, confirmed email and correct password.
- Expect redirect to `/dashboard`.
- Confirm `AuthProvider` shows the correct user email on the dashboard.

**Protected-route redirect:**

- Sign out, then navigate directly to `http://localhost:3000/dashboard`.
- Expect redirect to `/login?next=%2Fdashboard`.
- Sign in; expect redirect back to `/dashboard`.

**Validation errors (client-side, no network call):**

- Submit with empty email → "Email is required."
- Submit with `notanemail` → "Please enter a valid email address."
- Submit with valid email but empty password → "Password is required."

**Server error — wrong password:**

- Submit with correct email and wrong password → "Invalid email or password. Please try again."

**Unconfirmed email:**

- Submit with an account that has not completed email confirmation → "Your email has not been confirmed. Check your inbox for the confirmation link."

**Registration success message:**

- Navigate to `/login?message=check_email` → info message displayed.

**Callback failure message:**

- Navigate to `/login?error=callback_failed` → error message displayed.

**Authenticated-user redirect:**

- Sign in, then navigate to `http://localhost:3000/login`.
- Expect immediate redirect to `/dashboard`.

**Loading state:**

- Slow-network simulation: confirm button shows "Signing in…" and is disabled during submit.

### Preview / Deployed Environment

1. Ensure all environment variables are configured in Vercel (see `docs/environment-variables.md`).
2. Confirm the following Redirect URLs are registered in Supabase:
   - `https://<your-domain>/auth/callback`
   - `https://<your-domain>/reset-password`
3. Repeat all happy-path and error-path tests on the deployed URL.
4. Confirm session persists across page refreshes.
5. Confirm the "Forgot password?" link sends an email pointing to the correct domain.

---

## Implementation Files (Task 15)

| File                                     | Role                                                              |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `app/(public)/login/page.tsx`            | Login page: metadata, authenticated-user redirect, page layout   |
| `components/auth/sign-in-form.tsx`       | Sign-in form: validation, submission, error mapping, a11y        |
| `middleware.ts`                          | Protected-route redirect with `?next=` preservation (unchanged)  |
| `lib/supabase/auth.ts`                   | `requireUser()` server-side guard (unchanged)                    |
| `app/auth/callback/route.ts`             | OAuth/magic-link code exchange and profile sync (unchanged)      |
| `providers/auth-provider.tsx`            | Client-side session management and profile sync trigger (unchanged) |
| `config/routes.ts`                       | Route constants (unchanged)                                      |
| `docs/auth/login-flow.md`               | This document                                                     |
| `docs/auth/supabase-auth.md`            | Auth foundation reference (cross-links here)                     |
