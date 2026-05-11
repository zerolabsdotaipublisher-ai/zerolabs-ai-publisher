-- Storage access permissions and audit trail for ZLAP-STORY 10-5
-- Keeps storage permission logic in AI Publisher while reusing existing media/upload/asset tables.

create table if not exists public.storage_access_audit_logs (
  id                text primary key,
  resource_type     text not null,
  resource_id       text,
  actor_type        text not null,
  actor_id          uuid,
  service_role      text,
  tenant_id         text,
  owner_user_id     uuid,
  operation         text not null,
  allowed           boolean not null default false,
  denial_code       text,
  reason            text,
  environment_stage text,
  metadata_json     jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  constraint storage_access_audit_logs_resource_type_check check (
    resource_type in ('media', 'file_upload', 'ai_asset', 'website_media')
  ),
  constraint storage_access_audit_logs_actor_type_check check (
    actor_type in ('anonymous', 'user', 'service', 'system')
  ),
  constraint storage_access_audit_logs_operation_check check (
    operation in ('upload', 'read', 'preview', 'download', 'signed_url', 'update', 'replace', 'delete', 'manage')
  ),
  constraint storage_access_audit_logs_service_role_check check (
    service_role is null or service_role in ('ai_generation_worker', 'publishing_worker', 'cleanup_job', 'storage_processing')
  )
);

create index if not exists idx_storage_access_audit_logs_resource
  on public.storage_access_audit_logs(resource_type, resource_id, created_at desc);

create index if not exists idx_storage_access_audit_logs_actor
  on public.storage_access_audit_logs(actor_type, actor_id, created_at desc);

create index if not exists idx_storage_access_audit_logs_tenant
  on public.storage_access_audit_logs(tenant_id, created_at desc);

alter table public.storage_access_audit_logs enable row level security;
