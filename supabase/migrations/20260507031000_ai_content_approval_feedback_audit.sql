-- Approval comments + audit persistence for ZLAP-STORY 9-3

create table if not exists public.ai_content_approval_comments (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint ai_content_approval_comments_author_role_check
    check (author_role in ('creator', 'reviewer', 'approver'))
);

create index if not exists idx_ai_content_approval_comments_owner_content_created
  on public.ai_content_approval_comments(user_id, content_id, created_at asc);

alter table public.ai_content_approval_comments enable row level security;

drop policy if exists "approval_comments_select_own" on public.ai_content_approval_comments;
create policy "approval_comments_select_own"
  on public.ai_content_approval_comments
  for select
  using (auth.uid() = user_id);

drop policy if exists "approval_comments_insert_own" on public.ai_content_approval_comments;
create policy "approval_comments_insert_own"
  on public.ai_content_approval_comments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "approval_comments_delete_own" on public.ai_content_approval_comments;
create policy "approval_comments_delete_own"
  on public.ai_content_approval_comments
  for delete
  using (auth.uid() = user_id);

create table if not exists public.ai_content_approval_audit (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  action text not null,
  actor_role text not null,
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_content_approval_audit_actor_role_check
    check (actor_role in ('creator', 'reviewer', 'approver'))
);

create index if not exists idx_ai_content_approval_audit_owner_content_created
  on public.ai_content_approval_audit(user_id, content_id, created_at desc);

alter table public.ai_content_approval_audit enable row level security;

drop policy if exists "approval_audit_select_own" on public.ai_content_approval_audit;
create policy "approval_audit_select_own"
  on public.ai_content_approval_audit
  for select
  using (auth.uid() = user_id);

drop policy if exists "approval_audit_insert_own" on public.ai_content_approval_audit;
create policy "approval_audit_insert_own"
  on public.ai_content_approval_audit
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "approval_audit_delete_own" on public.ai_content_approval_audit;
create policy "approval_audit_delete_own"
  on public.ai_content_approval_audit
  for delete
  using (auth.uid() = user_id);
