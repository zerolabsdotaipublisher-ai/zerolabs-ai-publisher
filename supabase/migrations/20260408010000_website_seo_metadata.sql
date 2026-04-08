-- SEO metadata storage for ZLAP-STORY 3-6
-- Stores generated site/page metadata snapshots per structure version.

create table if not exists public.website_seo_metadata (
  id                   text        primary key,
  structure_id         text        not null references public.website_structures(id) on delete cascade,
  user_id              uuid        not null references auth.users(id) on delete cascade,
  page_slug            text        not null,
  metadata_json        jsonb       not null,
  generated_from_input jsonb       not null,
  version              integer     not null default 1,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_website_seo_metadata_structure
  on public.website_seo_metadata(structure_id);

create index if not exists idx_website_seo_metadata_user
  on public.website_seo_metadata(user_id);

create unique index if not exists uq_website_seo_metadata_lookup
  on public.website_seo_metadata(structure_id, page_slug, version);

alter table public.website_seo_metadata enable row level security;

drop trigger if exists set_website_seo_metadata_updated_at on public.website_seo_metadata;
create trigger set_website_seo_metadata_updated_at
  before update on public.website_seo_metadata
  for each row
  execute function public.set_updated_at();

drop policy if exists "website_seo_metadata_select_own" on public.website_seo_metadata;
create policy "website_seo_metadata_select_own"
  on public.website_seo_metadata
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_seo_metadata_insert_own" on public.website_seo_metadata;
create policy "website_seo_metadata_insert_own"
  on public.website_seo_metadata
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_seo_metadata_update_own" on public.website_seo_metadata;
create policy "website_seo_metadata_update_own"
  on public.website_seo_metadata
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_seo_metadata_delete_own" on public.website_seo_metadata;
create policy "website_seo_metadata_delete_own"
  on public.website_seo_metadata
  for delete
  using (auth.uid() = user_id);
