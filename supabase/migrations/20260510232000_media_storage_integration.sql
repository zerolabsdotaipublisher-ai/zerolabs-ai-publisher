-- Media storage integration for ZLAP-STORY 10-1
-- AI Publisher owns media metadata/workflows/permissions/usage tracking in-product.

create table if not exists public.media_assets (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  tenant_id           text not null,
  provider            text not null,
  bucket              text not null,
  object_key          text not null,
  media_type          text not null,
  mime_type           text not null,
  original_filename   text not null,
  file_size_bytes     bigint not null,
  width               integer,
  height              integer,
  linked_content_id   text,
  linked_content_type text,
  usage_metadata_json jsonb not null default '{}'::jsonb,
  metadata_json       jsonb not null default '{}'::jsonb,
  status              text not null default 'active',
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint media_assets_media_type_check check (
    media_type in ('image', 'video', 'document', 'thumbnail', 'asset', 'generated_image', 'file')
  ),
  constraint media_assets_status_check check (
    status in ('active', 'deleted')
  )
);

create unique index if not exists uq_media_assets_provider_bucket_key
  on public.media_assets(provider, bucket, object_key);

create index if not exists idx_media_assets_owner
  on public.media_assets(user_id, tenant_id, created_at desc);

create index if not exists idx_media_assets_owner_filters
  on public.media_assets(user_id, tenant_id, media_type, created_at desc)
  where deleted_at is null;

create index if not exists idx_media_assets_linked_content
  on public.media_assets(user_id, linked_content_type, linked_content_id)
  where linked_content_id is not null and deleted_at is null;

create table if not exists public.media_usage_links (
  id            text primary key,
  media_id      text not null references public.media_assets(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  tenant_id     text not null,
  content_id    text,
  content_type  text,
  usage_context text not null default 'library',
  created_at    timestamptz not null default now(),
  constraint media_usage_links_usage_context_check check (
    usage_context in ('library', 'editing', 'review', 'publishing', 'social', 'thumbnail', 'asset')
  )
);

create unique index if not exists uq_media_usage_links_ref
  on public.media_usage_links(media_id, coalesce(content_id, ''), coalesce(content_type, ''), usage_context);

create index if not exists idx_media_usage_links_owner
  on public.media_usage_links(user_id, tenant_id, created_at desc);

create table if not exists public.media_usage_quotas (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  tenant_id        text not null,
  total_bytes      bigint not null default 0,
  total_files      integer not null default 0,
  last_upload_at   timestamptz,
  last_delete_at   timestamptz,
  metadata_json    jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint media_usage_quotas_totals_non_negative check (
    total_bytes >= 0 and total_files >= 0
  )
);

create unique index if not exists uq_media_usage_quotas_owner
  on public.media_usage_quotas(user_id, tenant_id);

create index if not exists idx_media_usage_quotas_tenant
  on public.media_usage_quotas(tenant_id, updated_at desc);

alter table public.media_assets enable row level security;
alter table public.media_usage_links enable row level security;
alter table public.media_usage_quotas enable row level security;

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at
  before update on public.media_assets
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_media_usage_quotas_updated_at on public.media_usage_quotas;
create trigger set_media_usage_quotas_updated_at
  before update on public.media_usage_quotas
  for each row
  execute function public.set_updated_at();

drop policy if exists "media_assets_select_own" on public.media_assets;
create policy "media_assets_select_own"
  on public.media_assets
  for select
  using (auth.uid() = user_id);

drop policy if exists "media_assets_insert_own" on public.media_assets;
create policy "media_assets_insert_own"
  on public.media_assets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "media_assets_update_own" on public.media_assets;
create policy "media_assets_update_own"
  on public.media_assets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "media_assets_delete_own" on public.media_assets;
create policy "media_assets_delete_own"
  on public.media_assets
  for delete
  using (auth.uid() = user_id);

drop policy if exists "media_usage_links_select_own" on public.media_usage_links;
create policy "media_usage_links_select_own"
  on public.media_usage_links
  for select
  using (auth.uid() = user_id);

drop policy if exists "media_usage_links_insert_own" on public.media_usage_links;
create policy "media_usage_links_insert_own"
  on public.media_usage_links
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "media_usage_links_update_own" on public.media_usage_links;
create policy "media_usage_links_update_own"
  on public.media_usage_links
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "media_usage_links_delete_own" on public.media_usage_links;
create policy "media_usage_links_delete_own"
  on public.media_usage_links
  for delete
  using (auth.uid() = user_id);

drop policy if exists "media_usage_quotas_select_own" on public.media_usage_quotas;
create policy "media_usage_quotas_select_own"
  on public.media_usage_quotas
  for select
  using (auth.uid() = user_id);

drop policy if exists "media_usage_quotas_insert_own" on public.media_usage_quotas;
create policy "media_usage_quotas_insert_own"
  on public.media_usage_quotas
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "media_usage_quotas_update_own" on public.media_usage_quotas;
create policy "media_usage_quotas_update_own"
  on public.media_usage_quotas
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "media_usage_quotas_delete_own" on public.media_usage_quotas;
create policy "media_usage_quotas_delete_own"
  on public.media_usage_quotas
  for delete
  using (auth.uid() = user_id);
