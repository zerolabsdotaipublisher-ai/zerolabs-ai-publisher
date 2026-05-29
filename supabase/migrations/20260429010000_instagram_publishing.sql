-- Instagram publishing integration storage for ZLAP-STORY 7-3
-- Product-owned social account connections and social publish lifecycle state.

create table if not exists public.social_account_connections (
  id                        text primary key,
  user_id                   uuid not null references auth.users(id) on delete cascade,
  platform                  text not null,
  connection_status         text not null default 'disconnected',
  instagram_account_id      text,
  instagram_username        text,
  facebook_page_id          text,
  scopes                    text[] not null default '{}',
  encrypted_access_token    text,
  token_expires_at          timestamptz,
  token_last_refreshed_at   timestamptz,
  reauthorization_required  boolean not null default false,
  oauth_state               text,
  oauth_state_expires_at    timestamptz,
  last_error                text,
  metadata_json             jsonb not null default '{}'::jsonb,
  revoked_at                timestamptz,
  disconnected_at           timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.social_account_connections
  drop constraint if exists social_account_connections_platform_check;
alter table public.social_account_connections
  add constraint social_account_connections_platform_check
  check (platform in ('instagram'));

alter table public.social_account_connections
  drop constraint if exists social_account_connections_status_check;
alter table public.social_account_connections
  add constraint social_account_connections_status_check
  check (connection_status in (
    'disconnected',
    'connecting',
    'connected',
    'token_expiring',
    'reconnect_required',
    'revoked'
  ));

create index if not exists idx_social_account_connections_user_platform
  on public.social_account_connections(user_id, platform);
create index if not exists idx_social_account_connections_status
  on public.social_account_connections(connection_status, updated_at desc);

drop trigger if exists set_social_account_connections_updated_at on public.social_account_connections;
create trigger set_social_account_connections_updated_at
  before update on public.social_account_connections
  for each row
  execute function public.set_updated_at();

alter table public.social_account_connections enable row level security;

drop policy if exists "social_account_connections_select_own" on public.social_account_connections;
create policy "social_account_connections_select_own"
  on public.social_account_connections
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_account_connections_insert_own" on public.social_account_connections;
create policy "social_account_connections_insert_own"
  on public.social_account_connections
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_account_connections_update_own" on public.social_account_connections;
create policy "social_account_connections_update_own"
  on public.social_account_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_account_connections_delete_own" on public.social_account_connections;
create policy "social_account_connections_delete_own"
  on public.social_account_connections
  for delete
  using (auth.uid() = user_id);

create table if not exists public.social_publish_jobs (
  id                    text primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  platform              text not null,
  social_post_id        text references public.social_posts(id) on delete set null,
  status                text not null default 'draft',
  caption               text not null,
  media_url             text not null,
  instagram_account_id  text not null,
  facebook_page_id      text,
  scheduled_for         timestamptz not null,
  published_at          timestamptz,
  provider_creation_id  text,
  provider_media_id     text,
  attempt_count         integer not null default 0,
  max_attempts          integer not null default 3,
  next_attempt_at       timestamptz,
  retryable             boolean not null default false,
  last_error_code       text,
  last_error            text,
  metadata_json         jsonb not null default '{}'::jsonb,
  canceled_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.social_publish_jobs
  drop constraint if exists social_publish_jobs_platform_check;
alter table public.social_publish_jobs
  add constraint social_publish_jobs_platform_check
  check (platform in ('instagram'));

alter table public.social_publish_jobs
  drop constraint if exists social_publish_jobs_status_check;
alter table public.social_publish_jobs
  add constraint social_publish_jobs_status_check
  check (status in (
    'draft',
    'pending',
    'uploading',
    'publishing',
    'published',
    'failed',
    'retry_pending',
    'canceled'
  ));

alter table public.social_publish_jobs
  drop constraint if exists social_publish_jobs_retry_next_attempt_check;
alter table public.social_publish_jobs
  add constraint social_publish_jobs_retry_next_attempt_check
  check (status <> 'retry_pending' or next_attempt_at is not null);

create index if not exists idx_social_publish_jobs_user
  on public.social_publish_jobs(user_id, created_at desc);
create index if not exists idx_social_publish_jobs_due
  on public.social_publish_jobs(status, scheduled_for, next_attempt_at)
  where status in ('pending', 'retry_pending');
create index if not exists idx_social_publish_jobs_status
  on public.social_publish_jobs(user_id, status, updated_at desc);

drop trigger if exists set_social_publish_jobs_updated_at on public.social_publish_jobs;
create trigger set_social_publish_jobs_updated_at
  before update on public.social_publish_jobs
  for each row
  execute function public.set_updated_at();

alter table public.social_publish_jobs enable row level security;

drop policy if exists "social_publish_jobs_select_own" on public.social_publish_jobs;
create policy "social_publish_jobs_select_own"
  on public.social_publish_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_publish_jobs_insert_own" on public.social_publish_jobs;
create policy "social_publish_jobs_insert_own"
  on public.social_publish_jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_jobs_update_own" on public.social_publish_jobs;
create policy "social_publish_jobs_update_own"
  on public.social_publish_jobs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_jobs_delete_own" on public.social_publish_jobs;
create policy "social_publish_jobs_delete_own"
  on public.social_publish_jobs
  for delete
  using (auth.uid() = user_id);

create table if not exists public.social_publish_attempts (
  id                      text primary key,
  job_id                   text not null references public.social_publish_jobs(id) on delete cascade,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  status                   text not null,
  attempt                  integer not null default 1,
  started_at               timestamptz not null,
  completed_at             timestamptz,
  retryable                boolean not null default false,
  error_code               text,
  error_message            text,
  provider_response_json   jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.social_publish_attempts
  drop constraint if exists social_publish_attempts_status_check;
alter table public.social_publish_attempts
  add constraint social_publish_attempts_status_check
  check (status in ('uploading', 'publishing', 'published', 'failed', 'retry_pending'));

create index if not exists idx_social_publish_attempts_job
  on public.social_publish_attempts(job_id, created_at desc);
create index if not exists idx_social_publish_attempts_user
  on public.social_publish_attempts(user_id, created_at desc);

drop trigger if exists set_social_publish_attempts_updated_at on public.social_publish_attempts;
create trigger set_social_publish_attempts_updated_at
  before update on public.social_publish_attempts
  for each row
  execute function public.set_updated_at();

alter table public.social_publish_attempts enable row level security;

drop policy if exists "social_publish_attempts_select_own" on public.social_publish_attempts;
create policy "social_publish_attempts_select_own"
  on public.social_publish_attempts
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_publish_attempts_insert_own" on public.social_publish_attempts;
create policy "social_publish_attempts_insert_own"
  on public.social_publish_attempts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_attempts_update_own" on public.social_publish_attempts;
create policy "social_publish_attempts_update_own"
  on public.social_publish_attempts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_publish_attempts_delete_own" on public.social_publish_attempts;
create policy "social_publish_attempts_delete_own"
  on public.social_publish_attempts
  for delete
  using (auth.uid() = user_id);

create or replace function public.claim_due_social_publish_jobs(
  p_now timestamptz,
  p_limit integer default 10
)
returns setof public.social_publish_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
      from public.social_publish_jobs
     where status in ('pending', 'retry_pending')
       and (
         (status = 'pending' and scheduled_for <= p_now and (next_attempt_at is null or next_attempt_at <= p_now))
         or (status = 'retry_pending' and next_attempt_at is not null and next_attempt_at <= p_now)
       )
       and canceled_at is null
     order by next_attempt_at asc nulls first, scheduled_for asc, created_at asc
     limit greatest(coalesce(p_limit, 10), 1)
     for update skip locked
  )
  update public.social_publish_jobs as jobs
     set status = 'uploading',
         updated_at = p_now
    from due
   where jobs.id = due.id
   returning jobs.*;
end;
$$;
