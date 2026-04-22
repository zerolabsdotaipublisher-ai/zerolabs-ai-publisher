-- AI content scheduling storage for ZLAP-STORY 6-5
-- Product-owned scheduling state, recurrence rules, execution lifecycle,
-- run history, and queue claiming stay in AI Publisher.

create table if not exists public.content_schedules (
  id                text        primary key,
  structure_id      text        not null unique references public.website_structures(id) on delete cascade,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  title             text        not null,
  description       text,
  website_type      text        not null,
  target_content_type text      not null,
  execution_mode    text        not null,
  timezone          text        not null,
  starts_at_local   text        not null,
  recurrence_json   jsonb       not null,
  retry_policy_json jsonb       not null default '{}'::jsonb,
  lifecycle_json    jsonb       not null default '{}'::jsonb,
  status            text        not null default 'active',
  next_run_at       timestamptz,
  last_run_id       text,
  version           integer     not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.content_schedule_runs (
  id              text        primary key,
  schedule_id     text        not null references public.content_schedules(id) on delete cascade,
  structure_id    text        not null references public.website_structures(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  status          text        not null,
  attempt         integer     not null default 1,
  scheduled_for   timestamptz not null,
  started_at      timestamptz,
  completed_at    timestamptz,
  execution_mode  text        not null,
  publish_action  text,
  trigger_source  text        not null default 'scheduled',
  retryable       boolean     not null default false,
  error           text,
  logs_json       jsonb       not null default '[]'::jsonb,
  metrics_json    jsonb       not null default '{}'::jsonb,
  next_retry_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_content_schedules_user
  on public.content_schedules(user_id, updated_at desc);

create index if not exists idx_content_schedules_due
  on public.content_schedules(status, next_run_at)
  where next_run_at is not null;

create index if not exists idx_content_schedule_runs_schedule
  on public.content_schedule_runs(schedule_id, created_at desc);

create index if not exists idx_content_schedule_runs_due_retry
  on public.content_schedule_runs(status, next_retry_at)
  where next_retry_at is not null;

alter table public.content_schedules enable row level security;
alter table public.content_schedule_runs enable row level security;

drop trigger if exists set_content_schedules_updated_at on public.content_schedules;
create trigger set_content_schedules_updated_at
  before update on public.content_schedules
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_content_schedule_runs_updated_at on public.content_schedule_runs;
create trigger set_content_schedule_runs_updated_at
  before update on public.content_schedule_runs
  for each row
  execute function public.set_updated_at();

drop policy if exists "content_schedules_select_own" on public.content_schedules;
create policy "content_schedules_select_own"
  on public.content_schedules
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_schedules_insert_own" on public.content_schedules;
create policy "content_schedules_insert_own"
  on public.content_schedules
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "content_schedules_update_own" on public.content_schedules;
create policy "content_schedules_update_own"
  on public.content_schedules
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "content_schedules_delete_own" on public.content_schedules;
create policy "content_schedules_delete_own"
  on public.content_schedules
  for delete
  using (auth.uid() = user_id);

drop policy if exists "content_schedule_runs_select_own" on public.content_schedule_runs;
create policy "content_schedule_runs_select_own"
  on public.content_schedule_runs
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_schedule_runs_insert_own" on public.content_schedule_runs;
create policy "content_schedule_runs_insert_own"
  on public.content_schedule_runs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "content_schedule_runs_update_own" on public.content_schedule_runs;
create policy "content_schedule_runs_update_own"
  on public.content_schedule_runs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "content_schedule_runs_delete_own" on public.content_schedule_runs;
create policy "content_schedule_runs_delete_own"
  on public.content_schedule_runs
  for delete
  using (auth.uid() = user_id);

create or replace function public.claim_due_content_schedules(
  p_now timestamptz,
  p_limit integer default 10
)
returns setof public.content_schedules
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
      from public.content_schedules
     where status = 'active'
       and next_run_at is not null
       and next_run_at <= p_now
     order by next_run_at asc
     limit greatest(coalesce(p_limit, 10), 1)
     for update skip locked
  )
  update public.content_schedules as schedules
     set status = 'running',
         version = schedules.version + 1,
         updated_at = p_now
    from due
   where schedules.id = due.id
   returning schedules.*;
end;
$$;
