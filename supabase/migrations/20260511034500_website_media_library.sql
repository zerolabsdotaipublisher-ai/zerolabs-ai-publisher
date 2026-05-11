-- Website media library for ZLAP-STORY 10-3
-- AI Publisher owns website media metadata, website associations, usage tracking, and UI workflows.

create table if not exists public.website_media_library_items (
  id                       text primary key,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  tenant_id                text not null,
  website_id               text references public.website_structures(id) on delete set null,
  media_id                 text not null references public.media_assets(id) on delete restrict,
  ai_asset_id              text references public.ai_assets(id) on delete set null,
  display_name             text not null,
  description              text,
  alt_text                 text,
  media_type               text not null,
  mime_type                text not null,
  file_size_bytes          bigint not null default 0,
  width                    integer,
  height                   integer,
  tags                     text[] not null default '{}',
  usage_count              integer not null default 0,
  usage_summary_json       jsonb not null default '{}'::jsonb,
  association_summary_json jsonb not null default '{}'::jsonb,
  metadata_json            jsonb not null default '{}'::jsonb,
  archived_at              timestamptz,
  deleted_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint website_media_library_items_media_type_check check (
    media_type in ('image', 'video', 'document', 'thumbnail', 'asset', 'generated_image', 'file')
  ),
  constraint website_media_library_items_file_size_non_negative check (file_size_bytes >= 0),
  constraint website_media_library_items_dimensions_non_negative check (
    (width is null or width >= 0) and (height is null or height >= 0)
  ),
  constraint website_media_library_items_usage_count_non_negative check (usage_count >= 0)
);

create unique index if not exists uq_website_media_library_items_owner_media
  on public.website_media_library_items(user_id, tenant_id, media_id);

create index if not exists idx_website_media_library_items_owner_created
  on public.website_media_library_items(user_id, tenant_id, created_at desc);

create index if not exists idx_website_media_library_items_website
  on public.website_media_library_items(user_id, tenant_id, website_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_website_media_library_items_media_type
  on public.website_media_library_items(user_id, tenant_id, media_type, created_at desc)
  where deleted_at is null;

create index if not exists idx_website_media_library_items_tags
  on public.website_media_library_items using gin(tags);

create table if not exists public.website_media_library_usage (
  id              text primary key,
  library_item_id text not null references public.website_media_library_items(id) on delete cascade,
  media_id        text not null references public.media_assets(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  tenant_id       text not null,
  website_id      text not null default '__none__',
  content_id      text not null default '__none__',
  content_type    text not null default '__none__',
  page_id         text not null default '__none__',
  section_id      text not null default '__none__',
  usage_kind      text not null,
  metadata_json   jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint website_media_library_usage_kind_check check (
    usage_kind in ('library', 'editor_insert', 'website_content', 'page_asset', 'section_asset', 'ai_asset_source')
  )
);

create unique index if not exists uq_website_media_library_usage_ref
  on public.website_media_library_usage(library_item_id, website_id, content_id, content_type, page_id, section_id, usage_kind);

create index if not exists idx_website_media_library_usage_owner
  on public.website_media_library_usage(user_id, tenant_id, updated_at desc);

create or replace function public.refresh_website_media_library_item_usage_count()
returns trigger
language plpgsql
as $$
begin
  update public.website_media_library_items
    set usage_count = (
      select count(*)
      from public.website_media_library_usage usage
      where usage.library_item_id = coalesce(new.library_item_id, old.library_item_id)
    ),
    updated_at = now()
  where id = coalesce(new.library_item_id, old.library_item_id);

  return coalesce(new, old);
end;
$$;

alter table public.website_media_library_items enable row level security;
alter table public.website_media_library_usage enable row level security;

drop trigger if exists set_website_media_library_items_updated_at on public.website_media_library_items;
create trigger set_website_media_library_items_updated_at
  before update on public.website_media_library_items
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_website_media_library_usage_updated_at on public.website_media_library_usage;
create trigger set_website_media_library_usage_updated_at
  before update on public.website_media_library_usage
  for each row
  execute function public.set_updated_at();

drop trigger if exists sync_website_media_library_usage_count_insert on public.website_media_library_usage;
create trigger sync_website_media_library_usage_count_insert
  after insert on public.website_media_library_usage
  for each row
  execute function public.refresh_website_media_library_item_usage_count();

drop trigger if exists sync_website_media_library_usage_count_update on public.website_media_library_usage;
create trigger sync_website_media_library_usage_count_update
  after update on public.website_media_library_usage
  for each row
  execute function public.refresh_website_media_library_item_usage_count();

drop trigger if exists sync_website_media_library_usage_count_delete on public.website_media_library_usage;
create trigger sync_website_media_library_usage_count_delete
  after delete on public.website_media_library_usage
  for each row
  execute function public.refresh_website_media_library_item_usage_count();

drop policy if exists "website_media_library_items_select_own" on public.website_media_library_items;
create policy "website_media_library_items_select_own"
  on public.website_media_library_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_media_library_items_insert_own" on public.website_media_library_items;
create policy "website_media_library_items_insert_own"
  on public.website_media_library_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_media_library_items_update_own" on public.website_media_library_items;
create policy "website_media_library_items_update_own"
  on public.website_media_library_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_media_library_items_delete_own" on public.website_media_library_items;
create policy "website_media_library_items_delete_own"
  on public.website_media_library_items
  for delete
  using (auth.uid() = user_id);

drop policy if exists "website_media_library_usage_select_own" on public.website_media_library_usage;
create policy "website_media_library_usage_select_own"
  on public.website_media_library_usage
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_media_library_usage_insert_own" on public.website_media_library_usage;
create policy "website_media_library_usage_insert_own"
  on public.website_media_library_usage
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_media_library_usage_update_own" on public.website_media_library_usage;
create policy "website_media_library_usage_update_own"
  on public.website_media_library_usage
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_media_library_usage_delete_own" on public.website_media_library_usage;
create policy "website_media_library_usage_delete_own"
  on public.website_media_library_usage
  for delete
  using (auth.uid() = user_id);
