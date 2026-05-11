-- AI asset storage metadata for ZLAP-STORY 10-2
-- Reuses media storage/provider from ZLAP-STORY 10-1; AI Publisher owns AI asset metadata/workflow semantics.

create table if not exists public.ai_assets (
  id                       text primary key,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  tenant_id                text not null,
  media_id                 text not null references public.media_assets(id) on delete restrict,
  asset_type               text not null,
  asset_purpose            text not null,
  mime_type                text not null,
  file_size_bytes          bigint not null,
  width                    integer,
  height                   integer,
  status                   text not null default 'generating',
  source_workflow          text,
  generation_provider      text,
  generation_model         text,
  prompt_text              text,
  prompt_hash              text,
  prompt_metadata_json     jsonb not null default '{}'::jsonb,
  generation_settings_json jsonb not null default '{}'::jsonb,
  generation_target_json   jsonb not null default '{}'::jsonb,
  original_asset_id        text references public.ai_assets(id) on delete set null,
  parent_asset_id          text references public.ai_assets(id) on delete set null,
  replacement_asset_id     text references public.ai_assets(id) on delete set null,
  linked_content_id        text,
  linked_content_type      text,
  context_metadata_json    jsonb not null default '{}'::jsonb,
  usage_metadata_json      jsonb not null default '{}'::jsonb,
  lifecycle_json           jsonb not null default '[]'::jsonb,
  version                  integer not null default 1,
  is_variant               boolean not null default false,
  archived_at              timestamptz,
  deleted_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint ai_assets_asset_type_check check (
    asset_type in ('image', 'thumbnail', 'optimized', 'social', 'cropped', 'resized', 'other')
  ),
  constraint ai_assets_asset_purpose_check check (
    asset_purpose in ('hero', 'content', 'social', 'thumbnail', 'ad', 'variant', 'other')
  ),
  constraint ai_assets_status_check check (
    status in ('generating', 'available', 'attached', 'published', 'archived', 'failed', 'deleted')
  ),
  constraint ai_assets_file_size_non_negative check (file_size_bytes >= 0),
  constraint ai_assets_dimensions_non_negative check (
    (width is null or width >= 0) and (height is null or height >= 0)
  ),
  constraint ai_assets_version_positive check (version >= 1)
);

create unique index if not exists uq_ai_assets_media_id
  on public.ai_assets(media_id);

create index if not exists idx_ai_assets_owner_tenant_created
  on public.ai_assets(user_id, tenant_id, created_at desc);

create index if not exists idx_ai_assets_owner_status
  on public.ai_assets(user_id, tenant_id, status, created_at desc)
  where deleted_at is null;

create index if not exists idx_ai_assets_linked_content
  on public.ai_assets(user_id, linked_content_type, linked_content_id, created_at desc)
  where linked_content_id is not null and deleted_at is null;

create index if not exists idx_ai_assets_original
  on public.ai_assets(user_id, tenant_id, original_asset_id, created_at desc)
  where original_asset_id is not null and deleted_at is null;

create index if not exists idx_ai_assets_prompt_hash
  on public.ai_assets(user_id, prompt_hash, created_at desc)
  where prompt_hash is not null and deleted_at is null;

alter table public.ai_assets enable row level security;

drop trigger if exists set_ai_assets_updated_at on public.ai_assets;
create trigger set_ai_assets_updated_at
  before update on public.ai_assets
  for each row
  execute function public.set_updated_at();

drop policy if exists "ai_assets_select_own" on public.ai_assets;
create policy "ai_assets_select_own"
  on public.ai_assets
  for select
  using (auth.uid() = user_id);

drop policy if exists "ai_assets_insert_own" on public.ai_assets;
create policy "ai_assets_insert_own"
  on public.ai_assets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_assets_update_own" on public.ai_assets;
create policy "ai_assets_update_own"
  on public.ai_assets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_assets_delete_own" on public.ai_assets;
create policy "ai_assets_delete_own"
  on public.ai_assets
  for delete
  using (auth.uid() = user_id);
