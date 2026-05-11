-- File upload capabilities for ZLAP-STORY 10-4
-- Reuses media storage/provider workflows while AI Publisher owns upload lifecycle and associations.

create table if not exists public.file_uploads (
  id                       text primary key,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  tenant_id                text not null,
  media_id                 text references public.media_assets(id) on delete set null,
  source                   text not null,
  status                   text not null,
  usage_context            text not null default 'library',
  original_filename        text not null,
  mime_type                text not null,
  media_type               text not null,
  file_size_bytes          bigint not null default 0,
  linked_content_id        text,
  linked_content_type      text,
  retry_count              integer not null default 0,
  last_error_code          text,
  last_error_message       text,
  association_summary_json jsonb not null default '{}'::jsonb,
  metadata_json            jsonb not null default '{}'::jsonb,
  lifecycle_json           jsonb not null default '[]'::jsonb,
  completed_at             timestamptz,
  canceled_at              timestamptz,
  deleted_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint file_uploads_source_check check (
    source in ('media_library', 'website_editing', 'social_publishing', 'content_management')
  ),
  constraint file_uploads_status_check check (
    status in ('selected', 'validating', 'uploading', 'uploaded', 'failed', 'canceled')
  ),
  constraint file_uploads_usage_context_check check (
    usage_context in ('library', 'editing', 'review', 'publishing', 'social', 'thumbnail', 'asset')
  ),
  constraint file_uploads_media_type_check check (
    media_type in ('image', 'video', 'document', 'thumbnail', 'asset', 'generated_image', 'file')
  ),
  constraint file_uploads_file_size_non_negative check (file_size_bytes >= 0),
  constraint file_uploads_retry_count_non_negative check (retry_count >= 0)
);

create index if not exists idx_file_uploads_owner_created
  on public.file_uploads(user_id, tenant_id, created_at desc);

create index if not exists idx_file_uploads_owner_status
  on public.file_uploads(user_id, tenant_id, status, created_at desc)
  where deleted_at is null;

create index if not exists idx_file_uploads_owner_source
  on public.file_uploads(user_id, tenant_id, source, created_at desc)
  where deleted_at is null;

create index if not exists idx_file_uploads_media
  on public.file_uploads(user_id, media_id)
  where media_id is not null;

create table if not exists public.file_upload_associations (
  id               text primary key,
  upload_id        text not null references public.file_uploads(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  tenant_id        text not null,
  association_type text not null,
  association_id   text not null,
  content_id       text,
  content_type     text,
  metadata_json    jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint file_upload_associations_type_check check (
    association_type in ('website', 'page', 'section', 'content_record', 'media_library', 'website_media_library', 'social_post')
  )
);

create unique index if not exists uq_file_upload_associations_ref
  on public.file_upload_associations(upload_id, association_type, association_id, coalesce(content_id, '__none__'), coalesce(content_type, '__none__'));

create index if not exists idx_file_upload_associations_owner
  on public.file_upload_associations(user_id, tenant_id, updated_at desc);

alter table public.file_uploads enable row level security;
alter table public.file_upload_associations enable row level security;

drop trigger if exists set_file_uploads_updated_at on public.file_uploads;
create trigger set_file_uploads_updated_at
  before update on public.file_uploads
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_file_upload_associations_updated_at on public.file_upload_associations;
create trigger set_file_upload_associations_updated_at
  before update on public.file_upload_associations
  for each row
  execute function public.set_updated_at();

drop policy if exists "file_uploads_select_own" on public.file_uploads;
create policy "file_uploads_select_own"
  on public.file_uploads
  for select
  using (auth.uid() = user_id);

drop policy if exists "file_uploads_insert_own" on public.file_uploads;
create policy "file_uploads_insert_own"
  on public.file_uploads
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "file_uploads_update_own" on public.file_uploads;
create policy "file_uploads_update_own"
  on public.file_uploads
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "file_uploads_delete_own" on public.file_uploads;
create policy "file_uploads_delete_own"
  on public.file_uploads
  for delete
  using (auth.uid() = user_id);

drop policy if exists "file_upload_associations_select_own" on public.file_upload_associations;
create policy "file_upload_associations_select_own"
  on public.file_upload_associations
  for select
  using (auth.uid() = user_id);

drop policy if exists "file_upload_associations_insert_own" on public.file_upload_associations;
create policy "file_upload_associations_insert_own"
  on public.file_upload_associations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "file_upload_associations_update_own" on public.file_upload_associations;
create policy "file_upload_associations_update_own"
  on public.file_upload_associations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "file_upload_associations_delete_own" on public.file_upload_associations;
create policy "file_upload_associations_delete_own"
  on public.file_upload_associations
  for delete
  using (auth.uid() = user_id);
