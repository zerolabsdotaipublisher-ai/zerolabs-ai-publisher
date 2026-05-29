-- Content revision history persistence for ZLAP-STORY 9-4

create table if not exists public.ai_content_revisions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  content_type text not null,
  source_id text not null,
  structure_id text,
  version_number integer not null,
  action_type text not null,
  change_summary text not null,
  snapshot_json jsonb not null,
  summary_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  related_workflow_ids jsonb not null default '{}'::jsonb,
  restored_from_revision_id text references public.ai_content_revisions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_content_revisions_content_type_check
    check (content_type in ('website_page', 'blog_post', 'article', 'social_post')),
  constraint ai_content_revisions_action_type_check
    check (action_type in (
      'content_created',
      'manual_save',
      'autosave_checkpoint',
      'ai_regenerate',
      'approval_submit',
      'approval_approve',
      'approval_reject',
      'approval_request_changes',
      'publish',
      'publish_update',
      'restore'
    )),
  constraint ai_content_revisions_unique_version unique (user_id, content_id, version_number)
);

create index if not exists idx_ai_content_revisions_user_content_version
  on public.ai_content_revisions(user_id, content_id, version_number desc);

create index if not exists idx_ai_content_revisions_user_type_content
  on public.ai_content_revisions(user_id, content_type, content_id, created_at desc);

create index if not exists idx_ai_content_revisions_structure
  on public.ai_content_revisions(user_id, structure_id, created_at desc)
  where structure_id is not null;

alter table public.ai_content_revisions enable row level security;

drop policy if exists "content_revisions_select_own" on public.ai_content_revisions;
create policy "content_revisions_select_own"
  on public.ai_content_revisions
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_revisions_insert_own" on public.ai_content_revisions;
create policy "content_revisions_insert_own"
  on public.ai_content_revisions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "content_revisions_delete_own" on public.ai_content_revisions;
create policy "content_revisions_delete_own"
  on public.ai_content_revisions
  for delete
  using (auth.uid() = user_id);

create table if not exists public.ai_content_revision_audit (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  revision_id text references public.ai_content_revisions(id) on delete set null,
  action text not null,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_content_revision_audit_action_check
    check (action in ('created', 'restored', 'listed', 'viewed', 'compared'))
);

create index if not exists idx_ai_content_revision_audit_user_content_created
  on public.ai_content_revision_audit(user_id, content_id, created_at desc);

alter table public.ai_content_revision_audit enable row level security;

drop policy if exists "content_revision_audit_select_own" on public.ai_content_revision_audit;
create policy "content_revision_audit_select_own"
  on public.ai_content_revision_audit
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_revision_audit_insert_own" on public.ai_content_revision_audit;
create policy "content_revision_audit_insert_own"
  on public.ai_content_revision_audit
  for insert
  with check (auth.uid() = user_id and auth.uid() = actor_user_id);

drop policy if exists "content_revision_audit_delete_own" on public.ai_content_revision_audit;
create policy "content_revision_audit_delete_own"
  on public.ai_content_revision_audit
  for delete
  using (auth.uid() = user_id);

create or replace function public.insert_ai_content_revision(
  p_id text,
  p_user_id uuid,
  p_content_id text,
  p_content_type text,
  p_source_id text,
  p_structure_id text,
  p_action_type text,
  p_change_summary text,
  p_snapshot_json jsonb,
  p_summary_json jsonb default '{}'::jsonb,
  p_metadata_json jsonb default '{}'::jsonb,
  p_related_workflow_ids jsonb default '{}'::jsonb,
  p_restored_from_revision_id text default null,
  p_created_at timestamptz default now()
)
returns public.ai_content_revisions
language plpgsql
as $$
declare
  v_version_number integer;
  v_row public.ai_content_revisions;
begin
  perform pg_advisory_xact_lock(hashtext((p_user_id::text || ':' || p_content_id)));

  select coalesce(max(version_number), 0) + 1
    into v_version_number
    from public.ai_content_revisions
   where user_id = p_user_id
     and content_id = p_content_id;

  insert into public.ai_content_revisions (
    id,
    user_id,
    content_id,
    content_type,
    source_id,
    structure_id,
    version_number,
    action_type,
    change_summary,
    snapshot_json,
    summary_json,
    metadata_json,
    related_workflow_ids,
    restored_from_revision_id,
    created_at
  )
  values (
    p_id,
    p_user_id,
    p_content_id,
    p_content_type,
    p_source_id,
    p_structure_id,
    v_version_number,
    p_action_type,
    p_change_summary,
    p_snapshot_json,
    p_summary_json,
    p_metadata_json,
    p_related_workflow_ids,
    p_restored_from_revision_id,
    p_created_at
  )
  returning * into v_row;

  return v_row;
end;
$$;
