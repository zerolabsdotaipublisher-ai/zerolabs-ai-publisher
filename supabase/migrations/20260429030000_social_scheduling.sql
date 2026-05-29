-- Social media scheduling storage for ZLAP-STORY 7-4
-- Domain logic remains product-owned in AI Publisher.

create table if not exists public.social_schedules (
  id                text primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  structure_id      text references public.website_structures(id) on delete set null,
  social_post_id    text not null references public.social_posts(id) on delete cascade,
  title             text not null,
  description       text,
  timezone          text not null,
  starts_at_local   text not null,
  recurrence_json   jsonb not null default '{}'::jsonb,
  targets_json      jsonb not null default '[]'::jsonb,
  retry_policy_json jsonb not null default '{}'::jsonb,
  lifecycle_json    jsonb not null default '{}'::jsonb,
  status            text not null default 'draft',
  scheduled_for     timestamptz,
  last_run_id       text,
  version           integer not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.social_schedules
  drop constraint if exists social_schedules_status_check;
alter table public.social_schedules
  add constraint social_schedules_status_check
  check (status in (
    'draft',
    'scheduled',
    'queued',
    'publishing',
    'published',
    'failed',
    'canceled',
    'retry_pending'
  ));

create index if not exists idx_social_schedules_user
  on public.social_schedules(user_id, updated_at desc);
create index if not exists idx_social_schedules_due
  on public.social_schedules(status, scheduled_for)
  where scheduled_for is not null;
create index if not exists idx_social_schedules_post
  on public.social_schedules(social_post_id, updated_at desc);

create table if not exists public.social_schedule_runs (
  id                 text primary key,
  schedule_id        text not null references public.social_schedules(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  social_post_id     text not null references public.social_posts(id) on delete cascade,
  status             text not null,
  attempt            integer not null default 1,
  scheduled_for      timestamptz not null,
  started_at         timestamptz,
  completed_at       timestamptz,
  trigger_source     text not null default 'scheduled',
  target_platforms   text[] not null default '{}',
  published_platforms text[] not null default '{}',
  failed_platforms   text[] not null default '{}',
  queued_jobs_json   jsonb not null default '[]'::jsonb,
  retryable          boolean not null default false,
  error              text,
  logs_json          jsonb not null default '[]'::jsonb,
  next_retry_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.social_schedule_runs
  drop constraint if exists social_schedule_runs_status_check;
alter table public.social_schedule_runs
  add constraint social_schedule_runs_status_check
  check (status in ('queued', 'publishing', 'published', 'failed', 'retry_pending', 'canceled'));

alter table public.social_schedule_runs
  drop constraint if exists social_schedule_runs_trigger_check;
alter table public.social_schedule_runs
  add constraint social_schedule_runs_trigger_check
  check (trigger_source in ('scheduled', 'manual', 'retry'));

create index if not exists idx_social_schedule_runs_schedule
  on public.social_schedule_runs(schedule_id, created_at desc);
create index if not exists idx_social_schedule_runs_user
  on public.social_schedule_runs(user_id, created_at desc);

create table if not exists public.social_schedule_events (
  id            text primary key,
  schedule_id   text not null references public.social_schedules(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  run_id        text,
  event_type    text not null,
  severity      text not null default 'info',
  message       text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

alter table public.social_schedule_events
  drop constraint if exists social_schedule_events_type_check;
alter table public.social_schedule_events
  add constraint social_schedule_events_type_check
  check (event_type in ('scheduled', 'queued', 'published', 'failed', 'attention_required', 'retry_pending', 'canceled'));

alter table public.social_schedule_events
  drop constraint if exists social_schedule_events_severity_check;
alter table public.social_schedule_events
  add constraint social_schedule_events_severity_check
  check (severity in ('info', 'warning', 'error'));

create index if not exists idx_social_schedule_events_schedule
  on public.social_schedule_events(schedule_id, created_at desc);

drop trigger if exists set_social_schedules_updated_at on public.social_schedules;
create trigger set_social_schedules_updated_at
  before update on public.social_schedules
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_social_schedule_runs_updated_at on public.social_schedule_runs;
create trigger set_social_schedule_runs_updated_at
  before update on public.social_schedule_runs
  for each row
  execute function public.set_updated_at();

alter table public.social_schedules enable row level security;
alter table public.social_schedule_runs enable row level security;
alter table public.social_schedule_events enable row level security;

drop policy if exists "social_schedules_select_own" on public.social_schedules;
create policy "social_schedules_select_own"
  on public.social_schedules
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_schedules_insert_own" on public.social_schedules;
create policy "social_schedules_insert_own"
  on public.social_schedules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_schedules_update_own" on public.social_schedules;
create policy "social_schedules_update_own"
  on public.social_schedules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_schedules_delete_own" on public.social_schedules;
create policy "social_schedules_delete_own"
  on public.social_schedules
  for delete
  using (auth.uid() = user_id);

drop policy if exists "social_schedule_runs_select_own" on public.social_schedule_runs;
create policy "social_schedule_runs_select_own"
  on public.social_schedule_runs
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_schedule_runs_insert_own" on public.social_schedule_runs;
create policy "social_schedule_runs_insert_own"
  on public.social_schedule_runs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_schedule_runs_update_own" on public.social_schedule_runs;
create policy "social_schedule_runs_update_own"
  on public.social_schedule_runs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_schedule_runs_delete_own" on public.social_schedule_runs;
create policy "social_schedule_runs_delete_own"
  on public.social_schedule_runs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "social_schedule_events_select_own" on public.social_schedule_events;
create policy "social_schedule_events_select_own"
  on public.social_schedule_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_schedule_events_insert_own" on public.social_schedule_events;
create policy "social_schedule_events_insert_own"
  on public.social_schedule_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_schedule_events_update_own" on public.social_schedule_events;
create policy "social_schedule_events_update_own"
  on public.social_schedule_events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_schedule_events_delete_own" on public.social_schedule_events;
create policy "social_schedule_events_delete_own"
  on public.social_schedule_events
  for delete
  using (auth.uid() = user_id);

create or replace function public.claim_due_social_schedules(
  p_now timestamptz,
  p_limit integer default 10
)
returns setof public.social_schedules
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
      from public.social_schedules
     where status in ('scheduled', 'retry_pending')
       and scheduled_for is not null
       and scheduled_for <= p_now
     order by scheduled_for asc
     limit greatest(coalesce(p_limit, 10), 1)
     for update skip locked
  )
  update public.social_schedules as schedules
     set status = 'queued',
         version = schedules.version + 1,
         updated_at = p_now
    from due
   where schedules.id = due.id
   returning schedules.*;
end;
$$;
