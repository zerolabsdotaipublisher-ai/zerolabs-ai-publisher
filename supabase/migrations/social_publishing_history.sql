-- Social publishing history storage for ZLAP-STORY 7-5
-- AI Publisher-owned audit and observability history for social publishing lifecycle.

create table if not exists public.social_publish_history_jobs (
  id                     text primary key,
  user_id                uuid not null references auth.users(id) on delete cascade,
  tenant_id              text,
  structure_id           text references public.website_structures(id) on delete set null,
  social_post_id         text references public.social_posts(id) on delete set null,
  publish_job_id         text references public.social_publish_jobs(id) on delete set null,
  source                 text not null,
  source_ref_id          text,
  status                 text not null default 'requested',
  platform               text not null,
  content_snapshot_json  jsonb not null default '{}'::jsonb,
  account_reference_json jsonb not null default '{}'::jsonb,
  request_payload_json   jsonb not null default '{}'::jsonb,
  response_payload_json  jsonb not null default '{}'::jsonb,
  lifecycle_json         jsonb not null default '[]'::jsonb,
  error_json             jsonb,
  scheduled_at           timestamptz,
  started_at             timestamptz,
  completed_at           timestamptz,
  retry_at               timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.social_publish_history_jobs
  drop constraint if exists social_publish_history_jobs_source_check;
alter table public.social_publish_history_jobs
  add constraint social_publish_history_jobs_source_check
  check (source in ('manual', 'schedule', 'retry'));

alter table public.social_publish_history_jobs
  drop constraint if exists social_publish_history_jobs_status_check;
alter table public.social_publish_history_jobs
  add constraint social_publish_history_jobs_status_check
  check (status in ('requested', 'queued', 'publishing', 'published', 'failed', 'retry', 'canceled'));

alter table public.social_publish_history_jobs
  drop constraint if exists social_publish_history_jobs_platform_check;
alter table public.social_publish_history_jobs
  add constraint social_publish_history_jobs_platform_check
  check (platform in ('instagram', 'facebook', 'x', 'linkedin'));

create index if not exists idx_social_publish_history_jobs_user
  on public.social_publish_history_jobs(user_id, created_at desc);
create index if not exists idx_social_publish_history_jobs_status
  on public.social_publish_history_jobs(user_id, status, created_at desc);
create index if not exists idx_social_publish_history_jobs_platform
  on public.social_publish_history_jobs(user_id, platform, created_at desc);
create index if not exists idx_social_publish_history_jobs_publish_job
  on public.social_publish_history_jobs(publish_job_id);
create index if not exists idx_social_publish_history_jobs_scheduled
  on public.social_publish_history_jobs(status, scheduled_at)
  where scheduled_at is not null;

drop trigger if exists set_social_publish_history_jobs_updated_at on public.social_publish_history_jobs;
create trigger set_social_publish_history_jobs_updated_at
  before update on public.social_publish_history_jobs
  for each row
  execute function public.set_updated_at();

create table if not exists public.social_publish_history_deliveries (
  id                     text primary key,
  history_job_id         text not null references public.social_publish_history_jobs(id) on delete cascade,
  user_id                uuid not null references auth.users(id) on delete cascade,
  tenant_id              text,
  platform               text not null,
  status                 text not null default 'requested',
  account_reference_json jsonb not null default '{}'::jsonb,
  request_payload_json   jsonb not null default '{}'::jsonb,
  response_payload_json  jsonb not null default '{}'::jsonb,
  error_json             jsonb,
  requested_at           timestamptz,
  queued_at              timestamptz,
  started_at             timestamptz,
  completed_at           timestamptz,
  retry_at               timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.social_publish_history_deliveries
  drop constraint if exists social_publish_history_deliveries_platform_check;
alter table public.social_publish_history_deliveries
  add constraint social_publish_history_deliveries_platform_check
  check (platform in ('instagram', 'facebook', 'x', 'linkedin'));

alter table public.social_publish_history_deliveries
  drop constraint if exists social_publish_history_deliveries_status_check;
alter table public.social_publish_history_deliveries
  add constraint social_publish_history_deliveries_status_check
  check (status in ('requested', 'queued', 'publishing', 'published', 'failed', 'retry', 'canceled'));

create index if not exists idx_social_publish_history_deliveries_job
  on public.social_publish_history_deliveries(history_job_id, created_at asc);
create index if not exists idx_social_publish_history_deliveries_user
  on public.social_publish_history_deliveries(user_id, platform, status, created_at desc);

drop trigger if exists set_social_publish_history_deliveries_updated_at on public.social_publish_history_deliveries;
create trigger set_social_publish_history_deliveries_updated_at
  before update on public.social_publish_history_deliveries
  for each row
  execute function public.set_updated_at();

create table if not exists public.social_publish_history_events (
  id            text primary key,
  history_job_id text not null references public.social_publish_history_jobs(id) on delete cascade,
  delivery_id   text references public.social_publish_history_deliveries(id) on delete set null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  tenant_id     text,
  event_type    text not null,
  severity      text not null default 'info',
  message       text not null,
  payload_json  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

alter table public.social_publish_history_events
  drop constraint if exists social_publish_history_events_type_check;
alter table public.social_publish_history_events
  add constraint social_publish_history_events_type_check
  check (event_type in (
    'requested',
    'queued',
    'publishing',
    'published',
    'failed',
    'retry',
    'canceled',
    'delivery_request',
    'delivery_response',
    'audit'
  ));

alter table public.social_publish_history_events
  drop constraint if exists social_publish_history_events_severity_check;
alter table public.social_publish_history_events
  add constraint social_publish_history_events_severity_check
  check (severity in ('info', 'warning', 'error'));

create index if not exists idx_social_publish_history_events_job
  on public.social_publish_history_events(history_job_id, created_at desc);
create index if not exists idx_social_publish_history_events_user
  on public.social_publish_history_events(user_id, created_at desc);

alter table public.social_publish_history_jobs enable row level security;
alter table public.social_publish_history_deliveries enable row level security;
alter table public.social_publish_history_events enable row level security;

drop policy if exists "social_publish_history_jobs_select_own" on public.social_publish_history_jobs;
create policy "social_publish_history_jobs_select_own"
  on public.social_publish_history_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_publish_history_jobs_insert_own" on public.social_publish_history_jobs;
create policy "social_publish_history_jobs_insert_own"
  on public.social_publish_history_jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_jobs_update_own" on public.social_publish_history_jobs;
create policy "social_publish_history_jobs_update_own"
  on public.social_publish_history_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_jobs_delete_own" on public.social_publish_history_jobs;
create policy "social_publish_history_jobs_delete_own"
  on public.social_publish_history_jobs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "social_publish_history_deliveries_select_own" on public.social_publish_history_deliveries;
create policy "social_publish_history_deliveries_select_own"
  on public.social_publish_history_deliveries
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_publish_history_deliveries_insert_own" on public.social_publish_history_deliveries;
create policy "social_publish_history_deliveries_insert_own"
  on public.social_publish_history_deliveries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_deliveries_update_own" on public.social_publish_history_deliveries;
create policy "social_publish_history_deliveries_update_own"
  on public.social_publish_history_deliveries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_deliveries_delete_own" on public.social_publish_history_deliveries;
create policy "social_publish_history_deliveries_delete_own"
  on public.social_publish_history_deliveries
  for delete
  using (auth.uid() = user_id);

drop policy if exists "social_publish_history_events_select_own" on public.social_publish_history_events;
create policy "social_publish_history_events_select_own"
  on public.social_publish_history_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_publish_history_events_insert_own" on public.social_publish_history_events;
create policy "social_publish_history_events_insert_own"
  on public.social_publish_history_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_events_update_own" on public.social_publish_history_events;
create policy "social_publish_history_events_update_own"
  on public.social_publish_history_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_history_events_delete_own" on public.social_publish_history_events;
create policy "social_publish_history_events_delete_own"
  on public.social_publish_history_events
  for delete
  using (auth.uid() = user_id);
