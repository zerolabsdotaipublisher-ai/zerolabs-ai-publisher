# Registration Flow (ZLAP-STORY 2-1)

This document defines the registration flow for Zero Labs AI Publisher.
It extends the Supabase auth foundation established in ZLAP-STORY 2-0
and is the authoritative reference for registration requirements, validation rules,
redirect logic, success/error states, and testing guidance.

See also: [Supabase Auth Foundation](./supabase-auth.md)

---

## Registration Requirements (Task 1)

### Scope

- Email + password registration only (OAuth not in scope for this story).
- Email verification is **required** by default (Supabase sends a confirmation email).
- A `public.profiles` row is created for every confirmed auth user via the callback route.

### Required Fields (MVP)

| Field            | Type     | Required | Constraints                        |
| ---------------- | -------- | -------- | ---------------------------------- |
| Email            | email    | Yes      | Valid email format, trimmed        |
| Password         | password | Yes      | Minimum 8 characters               |
| Confirm Password | password | Yes      | Must match Password                |
| Full Name        | text     | No       | Trimmed; stored in `user_metadata` |

Password confirmation is required to prevent typos during account creation.

### Registration Form Structure (Task 2)

Fields are rendered in this order:

1. **Full name** — `type="text"`, optional, `autoComplete="name"`, `autoCapitalize="words"`
2. **Email** — `type="email"`, required, `autoComplete="email"`
3. **Password** — `type="password"`, required, `autoComplete="new-password"`, `minLength={8}`
   - Helper text: "Minimum 8 characters"
4. **Confirm password** — `type="password"`, required, `autoComplete="new-password"`, `minLength={8}`

A Terms of Service / Privacy Policy notice is shown below the submit button.
No additional onboarding fields are added beyond what the current profile model supports.

---

## Client-Side Validation Rules (Task 4)

Validation runs on form submit before any network request. Rules in order:

1. Email must not be empty.
2. Email must match the pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
3. Password must not be empty.
4. Password must be at least 8 characters.
5. Confirm password must equal password exactly.

Validation stops at the first failing rule and displays a single human-readable error message.
The form uses `noValidate` to suppress browser-native validation UI in favour of custom messages.

---

## Registration Submission (Task 5)

Submission calls `supabase.auth.signUp()` via the browser client:

```ts
supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    data: { full_name: fullName.trim() || undefined },
    emailRedirectTo: `${appUrl}/auth/callback`,
  },
});
```

`full_name` is stored in `auth.users.user_metadata` and synced to `public.profiles`
when the email confirmation link is clicked (see Profile Sync below).

---

## Email Verification Flow (Task 6)

Supabase sends a confirmation email when a new account is created with
`email confirmation` enabled in the Supabase project settings (the default).

1. User submits the registration form.
2. Supabase sends an email with a link pointing to `/auth/callback?code=<code>`.
3. The user is redirected to `/login?message=check_email`, which displays:
   > "Account created. Check your email to confirm your account, then sign in."
4. The user clicks the confirmation link in their inbox.
5. The callback route exchanges the code for a session and syncs the profile record.
6. The user is redirected to `/dashboard`.

The `emailRedirectTo` URL must be registered in **Supabase → Authentication → Redirect URLs**:

- `http://localhost:3000/auth/callback`
- `https://<production-domain>/auth/callback`

Do not invent a separate verification mechanism outside Supabase.

---

## Registration Success States (Task 7)

| Condition                               | Outcome                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| Sign-up succeeds (verification pending) | Inline success message shown, then redirect to `/login?message=check_email` |
| Login page loaded with `check_email`    | "Account created. Check your email to confirm your account, then sign in." |
| Confirmation link clicked               | Callback exchanges code → syncs profile → redirects to `/dashboard` |

The inline success message in the form (`role="status"`) is shown briefly before the redirect.

---

## Registration Error States (Task 8)

All Supabase error messages are mapped to user-friendly strings before display.

| Supabase error                            | User-facing message                                              |
| ----------------------------------------- | ---------------------------------------------------------------- |
| "User already registered"                 | "An account with this email already exists. Try signing in instead." |
| "Password should be at least N characters"| "Password must be at least 8 characters."                       |
| "Unable to validate email address"        | "Please enter a valid email address."                           |
| Rate-limit / "too many requests"          | "Too many sign-up attempts. Please wait a moment and try again."|
| Any other error                           | "Something went wrong. Please try again."                       |

Client-side validation errors (before network call):

| Rule violated            | Message                                   |
| ------------------------ | ----------------------------------------- |
| Empty email              | "Email is required."                      |
| Invalid email format     | "Please enter a valid email address."     |
| Empty password           | "Password is required."                   |
| Password too short       | "Password must be at least 8 characters." |
| Passwords do not match   | "Passwords do not match."                 |

Errors are displayed in a `<p role="alert">` element so screen readers announce them immediately.

---

## Post-Registration Redirect Logic (Task 9)

```
Register → success → /login?message=check_email (email verification pending)
                               ↓
                     User clicks email link
                               ↓
              /auth/callback?code=<code>
                               ↓
              callback: exchange code → sync profile
                               ↓
                          /dashboard
```

If verification is **disabled** in Supabase settings (not the default), Supabase returns a
session immediately. In that case the callback route still runs and the user lands on `/dashboard`.

The callback route respects a `next` query parameter if present, so deep links survive the
email-confirmation round-trip.

---

## Loading and Submission States (Task 10)

- The submit button is disabled while `isSubmitting` is true.
- The button label changes from "Create account" to "Creating account…" during submission.
- `aria-busy={isSubmitting}` is set on the button for screen-reader announcements.
- Duplicate submissions are prevented because the button is disabled until the request resolves.

---

## Terms / Privacy / Consent Notice (Task 11)

A plain-text notice is shown below the submit button:

> "By creating an account, you agree to our Terms of Service and Privacy Policy."

No links are added until the corresponding legal pages exist at verified routes.
When those pages are created, replace the notice with linked text, e.g.:

```tsx
By creating an account, you agree to our{" "}
<Link href={routes.terms}>Terms of Service</Link> and{" "}
<Link href={routes.privacy}>Privacy Policy</Link>.
```

and add `terms` and `privacy` keys to `config/routes.ts`.

---

## Accessibility and UX (Task 12)

The registration form implements the following accessibility requirements:

- Each `<input>` has a unique `id` (generated via React `useId()`).
- Each `<label>` uses `htmlFor` referencing the matching input `id`.
- Required fields are marked with `aria-required="true"`.
- Password helper text is linked via `aria-describedby`.
- Error messages use `role="alert"` for immediate screen-reader announcement.
- Success messages use `role="status"` for polite announcements.
- When an error is present, `aria-describedby` on inputs points to the error element.
- The form uses `noValidate` to suppress browser-native validation in favour of custom UX.
- The submit button is disabled during submission (`disabled`, `aria-busy`).
- `autoComplete` attributes guide password managers on every field.
- The layout is a single-column flex column, readable on mobile at any viewport width.

---

## Profile Sync After Registration (Task 13)

Profile sync is handled by the existing Story 2-0 infrastructure. No new sync code is needed.

**Flow:**

1. User submits registration form → Supabase creates `auth.users` row.
2. Supabase emails a confirmation link with a code pointing to `/auth/callback`.
3. Callback route (`app/auth/callback/route.ts`) exchanges the code for a session.
4. After exchange, `syncProfileFromAuthUser(user)` is called:
   - Upserts `{ id, email, full_name, avatar_url }` into `public.profiles`.
   - Uses the service-role client to bypass RLS.
5. `AuthProvider` additionally calls `/api/auth/profile-sync` on `onAuthStateChange` events,
   ensuring the profile row is refreshed on subsequent sign-ins.

The `full_name` entered at registration is stored in `auth.users.user_metadata` and
propagated to `public.profiles.full_name` by both sync paths above.

**Verification:** After a successful registration + email confirmation, query:

```sql
select id, email, full_name from public.profiles where email = '<registered-email>';
```

A row should exist with the correct `full_name`.

---

## Testing Guidance (Task 14)

### Local Testing

1. Copy `.env.example` to `.env.local` and fill in all required values.
2. Run `npm install && npm run dev`.
3. Visit `http://localhost:3000/signup`.

**Happy path:**

- Submit the form with a valid email, password ≥ 8 chars, matching confirm password.
- Expect redirect to `/login?message=check_email`.
- Check the Supabase inbox (or Supabase dashboard → Auth → Users) for the confirmation email.
- Click the confirmation link; expect redirect to `/dashboard`.
- Query `public.profiles` to confirm the row was created.

**Validation errors:**

- Submit with empty email → "Email is required."
- Submit with `notanemail` → "Please enter a valid email address."
- Submit with password `abc` → "Password must be at least 8 characters."
- Submit with mismatched passwords → "Passwords do not match."

**Server errors:**

- Register with an already-used email → "An account with this email already exists."

**Loading state:**

- Slow-network simulation: confirm button shows "Creating account…" and is disabled during submit.

### Preview / Deployed Environment

1. Ensure all environment variables are configured in Vercel (see `docs/environment-variables.md`).
2. Confirm the following Redirect URLs are registered in Supabase:
   - `https://<your-domain>/auth/callback`
   - `https://<your-domain>/reset-password`
3. Repeat the happy-path test on the deployed URL.
4. Confirm that emails contain the correct domain in the confirmation link.

### Callback Verification

Visit `/auth/callback?code=invalid` directly and confirm it redirects to `/login?error=callback_failed`.

---

## Implementation Files (Task 15)

| File                                        | Role                                                        |
| ------------------------------------------- | ----------------------------------------------------------- |
| `app/(public)/signup/page.tsx`              | Registration page with metadata                             |
| `components/auth/sign-up-form.tsx`          | Registration form: validation, submission, states, a11y     |
| `app/auth/callback/route.ts`                | Code exchange, profile sync, post-registration redirect     |
| `app/api/auth/profile-sync/route.ts`        | Profile sync on subsequent sign-ins                         |
| `lib/supabase/browser.ts`                   | Browser Supabase client used by the form                    |
| `lib/supabase/profile.ts`                   | Profile upsert logic (no changes needed)                    |
| `config/routes.ts`                          | Route constants (no changes needed for MVP)                 |
| `app/globals.css`                           | `.auth-field-hint` and `.auth-terms-notice` utility classes |
| `docs/auth/registration-flow.md`            | This document                                               |
| `docs/auth/supabase-auth.md`                | Auth foundation reference (cross-links here)                |
