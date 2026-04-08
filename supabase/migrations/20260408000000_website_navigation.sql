-- Navigation and hierarchy storage for ZLAP-STORY 3-5
-- Stores generated navigation schemas and page hierarchy snapshots per structure version.

create table if not exists public.website_navigation (
  id              text        primary key,
  structure_id    text        not null references public.website_structures(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  hierarchy_json  jsonb       not null,
  navigation_json jsonb       not null,
  version         integer     not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_website_navigation_structure
  on public.website_navigation(structure_id);

create index if not exists idx_website_navigation_user
  on public.website_navigation(user_id);

create unique index if not exists uq_website_navigation_version
  on public.website_navigation(structure_id, version);

alter table public.website_navigation enable row level security;

drop trigger if exists set_website_navigation_updated_at on public.website_navigation;
create trigger set_website_navigation_updated_at
  before update on public.website_navigation
  for each row
  execute function public.set_updated_at();

drop policy if exists "website_navigation_select_own" on public.website_navigation;
create policy "website_navigation_select_own"
  on public.website_navigation
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_navigation_insert_own" on public.website_navigation;
create policy "website_navigation_insert_own"
  on public.website_navigation
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_navigation_update_own" on public.website_navigation;
create policy "website_navigation_update_own"
  on public.website_navigation
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_navigation_delete_own" on public.website_navigation;
create policy "website_navigation_delete_own"
  on public.website_navigation
  for delete
  using (auth.uid() = user_id);
