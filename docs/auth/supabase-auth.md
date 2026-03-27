# Supabase Authentication Foundation (ZLAP-STORY 2-0)

This document defines the authentication foundation for Zero Labs AI Publisher using Supabase with Next.js App Router.

For the full registration flow definition (ZLAP-STORY 2-1), see [Registration Flow](./registration-flow.md).

## Requirements and Scope

- App-level auth is implemented in this Layer 1 product app.
- Environment values are read only through `@/config`.
- Browser and server Supabase client patterns are both supported.
- Protected app routes require an authenticated session.
- Public auth routes provide sign-up, sign-in, password reset, and callback handling.
- Auth user data is synced to `public.profiles`.
- RLS foundation enforces authenticated-user isolation for profile data.

## Supabase Project Settings

In Supabase Authentication settings:

- Set **Site URL** to the deployed app URL.
- Add redirect URLs for local and deployed callbacks:
  - `http://localhost:3000/auth/callback`
  - `https://<your-domain>/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://<your-domain>/reset-password`

## Implementation Map

- Browser client: `lib/supabase/browser.ts`
- Server client + service client: `lib/supabase/server.ts`
- Middleware session refresh helper: `lib/supabase/middleware.ts`
- Auth guard helper: `lib/supabase/auth.ts`
- Profile sync helper: `lib/supabase/profile.ts`
- Middleware protection: `middleware.ts`
- Callback handler: `app/auth/callback/route.ts`
- Sign-out endpoint: `app/api/auth/sign-out/route.ts`
- Profile sync endpoint: `app/api/auth/profile-sync/route.ts`
- Public auth pages: `app/(public)/*`
- Protected app area: `app/(app)/dashboard`

## Local and Deployed Validation

1. Configure `.env.local` from `.env.example`.
2. Verify required variables are present.
3. Run:
   - `npm install`
   - `npm run lint`
   - `npm run build`
4. Run `npm run dev` and verify:
   - sign up creates an auth user
   - sign in redirects to `/dashboard`
   - sign out returns to `/login`
   - forgot password sends reset link
   - reset password updates password
   - callback route exchanges auth code and redirects
   - unauthenticated access to `/dashboard` redirects to `/login`

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in client components.
- Profile synchronization uses server-side service role access in `lib/supabase/profile.ts`.
- User-driven reads/writes should rely on anon-key sessions and RLS policies.
