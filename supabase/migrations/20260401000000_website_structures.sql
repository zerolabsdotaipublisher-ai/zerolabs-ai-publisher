-- Website structures table for Zero Labs AI Publisher (ZLAP-STORY 3-2)
--
-- Stores the full generated website structure as JSONB alongside scalar
-- columns for fast querying.  The `structure` column holds the complete
-- typed WebsiteStructure object produced by lib/ai/structure/generator.ts.
-- The `source_input` column preserves the original WebsiteGenerationInput.
--
-- Row-level security restricts access to the owning user.  The application
-- layer additionally enforces ownership by filtering on user_id in all
-- queries.
--
-- The set_updated_at() trigger function is defined in the earlier
-- 20260327000000_auth_profiles.sql migration and is reused here.

create table if not exists public.website_structures (
  id            text        primary key,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  website_type  text        not null,
  site_title    text        not null,
  tagline       text        not null,
  structure     jsonb       not null,
  source_input  jsonb       not null,
  status        text        not null default 'draft',
  version       integer     not null default 1,
  generated_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.website_structures enable row level security;

drop trigger if exists set_website_structures_updated_at on public.website_structures;
create trigger set_website_structures_updated_at
  before update on public.website_structures
  for each row
  execute function public.set_updated_at();

-- Users may only read their own structures.
drop policy if exists "structures_select_own" on public.website_structures;
create policy "structures_select_own"
  on public.website_structures
  for select
  using (auth.uid() = user_id);

-- Users may only insert structures they own.
drop policy if exists "structures_insert_own" on public.website_structures;
create policy "structures_insert_own"
  on public.website_structures
  for insert
  with check (auth.uid() = user_id);

-- Users may only update their own structures.
drop policy if exists "structures_update_own" on public.website_structures;
create policy "structures_update_own"
  on public.website_structures
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users may only delete their own structures.
drop policy if exists "structures_delete_own" on public.website_structures;
create policy "structures_delete_own"
  on public.website_structures
  for delete
  using (auth.uid() = user_id);
