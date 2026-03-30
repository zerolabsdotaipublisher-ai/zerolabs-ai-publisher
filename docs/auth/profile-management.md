# Profile Management

Zero Labs AI Publisher maintains a **product-owned user profile** in `public.profiles` that is separate from the Supabase auth identity (`auth.users`).  
Auth handles *who you are*; the profile handles *how the product knows you*.

---

## Data Model

### `public.profiles`

| Column        | Type          | Nullable | Notes                                      |
|---------------|---------------|----------|--------------------------------------------|
| `id`          | `uuid`        | No       | Primary key — references `auth.users(id)`. System-managed. |
| `email`       | `text`        | No       | Cached from auth identity. System-managed. |
| `full_name`   | `text`        | Yes      | User-editable display name.                |
| `avatar_url`  | `text`        | Yes      | User-editable avatar URL.                  |
| `preferences` | `jsonb`       | Yes      | Reserved for future app preferences.       |
| `metadata`    | `jsonb`       | Yes      | Reserved for future extensible metadata.   |
| `created_at`  | `timestamptz` | No       | Set on insert. System-managed.             |
| `updated_at`  | `timestamptz` | No       | Auto-updated via DB trigger. System-managed. |

### Field ownership

**User-editable** (via profile form or `PATCH /api/profile`):
- `full_name`
- `avatar_url`

**System-managed** (never set by the caller):
- `id`, `email`, `created_at`, `updated_at`

---

## Database Schema

Migrations live in `supabase/migrations/`:

| File                                         | Description                                 |
|----------------------------------------------|---------------------------------------------|
| `20260327000000_auth_profiles.sql`           | Creates table, RLS, updated_at trigger      |
| `20260330000000_profiles_extension.sql`      | Adds `preferences` and `metadata` columns   |

---

## RLS Policies

Row Level Security is enabled on `public.profiles`.  
All policies key on `auth.uid() = id`, enforcing strict user isolation.

| Policy name             | Operation | Rule                      |
|-------------------------|-----------|---------------------------|
| `profiles_select_own`   | SELECT    | `auth.uid() = id`         |
| `profiles_insert_own`   | INSERT    | `auth.uid() = id`         |
| `profiles_update_own`   | UPDATE    | `auth.uid() = id` (both using and with check) |

> **Note:** The service-role key bypasses RLS.  The service layer (`lib/supabase/profile.ts`) uses the service client **only** for guaranteed writes during auth flows.  The API routes additionally gate on the session user ID so no cross-user access is possible even if the service client is used.

---

## Service Layer

All profile DB access goes through `lib/supabase/profile.ts`.  
Direct `supabase.from("profiles")` calls outside this module are prohibited.

### Functions

#### `getProfile(userId: string): Promise<Profile | null>`
Retrieves a profile by ID.  Returns `null` if no row exists.  
Uses the service client.

#### `updateProfile(userId: string, data: ProfileUpdateData): Promise<Profile>`
Updates editable fields (`full_name`, `avatar_url`).  Returns the updated row.  
`ProfileUpdateData` only exposes user-editable fields; system fields cannot be set.

#### `ensureProfile(user: User): Promise<Profile>`
Guarantees a profile row exists.  
- If a row already exists, returns it without writing.  
- If absent, calls `syncProfileFromAuthUser()` to create from auth metadata, then returns the new row.

Use this in page-level code to handle edge cases where the callback sync was skipped.

#### `syncProfileFromAuthUser(user: User): Promise<void>`
Upserts a profile from `auth.users` metadata (`full_name`, `avatar_url`).  
Called during auth callback and auth state change events to keep profile data in sync with the auth provider (e.g. Google display name updates).

---

## Profile Lifecycle

### Creation

A profile row is created automatically — the user never needs to explicitly create one.

**Primary path — email confirmation callback** (`app/auth/callback/route.ts`):
```
signup → email link → /auth/callback → exchangeCodeForSession → syncProfileFromAuthUser → profile row created
```

**Secondary path — auth state change** (`providers/auth-provider.tsx` → `POST /api/auth/profile-sync`):
```
login (new user ID detected) → POST /api/auth/profile-sync → syncProfileFromAuthUser → upsert
```

**Safety net — profile page** (`app/(app)/profile/page.tsx`):
```
page load → ensureProfile(user) → creates if absent → renders form
```

### Read

```
GET /api/profile
  ← 200 { profile: Profile }
  ← 401 Unauthorized
  ← 404 Profile not found
```

Server components use `getProfile(user.id)` directly.

### Update

```
PATCH /api/profile  { full_name?, avatar_url? }
  → validates editable fields only
  → updateProfile(user.id, data)
  ← 200 { profile: Profile }
  ← 400 Validation error
  ← 401 Unauthorized
  ← 500 Internal error
```

---

## Session Alignment

Profiles are **always** fetched using `session.user.id` (the authenticated user's UUID), never by email or other attributes.

- Server components: `getServerUser()` → `user.id`
- API routes: `supabase.auth.getUser()` → `user.id`
- Client state: `useAuth().user.id` (for display only; mutations go through API routes)

This prevents profile data from being loaded or modified by anyone other than the owner, regardless of RLS.

---

## UI

| File                                      | Description                                  |
|-------------------------------------------|----------------------------------------------|
| `app/(app)/profile/page.tsx`              | Server component — fetches profile, renders form |
| `components/profile/profile-form.tsx`     | Client component — form with full_name, avatar_url, and error/success states |

The profile page is protected by the `(app)` layout group which calls `requireUser()` on every render.

---

## Future Extension

The schema is ready for extension without breaking changes:

- `preferences` (`jsonb`) — store UI preferences, notification settings, etc.
- `metadata` (`jsonb`) — store arbitrary product metadata (onboarding state, feature flags per user, etc.)
- `role` — add a `role` column when RBAC is introduced (suggested: `text` with a `check` constraint)

New columns should be added via a new timestamped migration file and documented here.

---

## Related Documentation

- [Supabase Auth](./supabase-auth.md)
- [Registration Flow](./registration-flow.md)
- [Login Flow](./login-flow.md)
- [Session Management](./session-management.md)
- [Environment Variables](../environment-variables.md)
