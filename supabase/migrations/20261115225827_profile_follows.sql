-- Canonical user-to-user follow relationships for public profile social statistics.
-- This is intentionally separate from social_account_connections, which represents
-- external publishing-account OAuth connections rather than relationships between users.

create table if not exists public.profile_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_follows_follower_not_followed_check
    check (follower_user_id <> followed_user_id),
  constraint profile_follows_follower_followed_key
    unique (follower_user_id, followed_user_id)
);

create index if not exists idx_profile_follows_followed_user_id
  on public.profile_follows (followed_user_id);

create index if not exists idx_profile_follows_follower_user_id
  on public.profile_follows (follower_user_id);

alter table public.profile_follows enable row level security;

-- Relationship rows are public profile metadata. Clients may read them to derive
-- profile counts, while only a signed-in user can manage their own outgoing rows.
revoke all on table public.profile_follows from anon, authenticated;
grant select on table public.profile_follows to anon, authenticated;
grant insert, delete on table public.profile_follows to authenticated;

drop policy if exists "profile_follows_select_public" on public.profile_follows;
create policy "profile_follows_select_public"
  on public.profile_follows
  for select
  to anon, authenticated
  using (true);

drop policy if exists "profile_follows_insert_own" on public.profile_follows;
create policy "profile_follows_insert_own"
  on public.profile_follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_user_id);

drop policy if exists "profile_follows_delete_own" on public.profile_follows;
create policy "profile_follows_delete_own"
  on public.profile_follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_user_id);
