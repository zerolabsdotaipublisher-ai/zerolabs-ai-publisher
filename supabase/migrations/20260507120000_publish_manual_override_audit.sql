-- Manual publish override audit trail for ZLAP-STORY 9-6
create table if not exists public.publish_manual_override_audit (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  override_user_id uuid not null references auth.users(id) on delete cascade,
  structure_id text references public.website_structures(id) on delete set null,
  content_id text,
  target_content_id text not null,
  target_content_type text not null,
  override_used boolean not null default true,
  override_reason text not null,
  override_scenario text not null,
  override_timestamp timestamptz not null,
  bypassed_workflows text[] not null default '{}',
  approval_bypassed boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint publish_manual_override_target_type_check
    check (target_content_type in ('website', 'website_page', 'blog_post', 'article', 'social_post')),
  constraint publish_manual_override_scenario_check
    check (override_scenario in ('urgent_publish', 'hotfix_update', 'bypass_scheduled_time', 'bypass_approval'))
);

create index if not exists idx_publish_manual_override_user_created
  on public.publish_manual_override_audit(user_id, created_at desc);

create index if not exists idx_publish_manual_override_structure_created
  on public.publish_manual_override_audit(structure_id, created_at desc)
  where structure_id is not null;

alter table public.publish_manual_override_audit enable row level security;

drop policy if exists "publish_manual_override_select_own" on public.publish_manual_override_audit;
create policy "publish_manual_override_select_own"
  on public.publish_manual_override_audit
  for select
  using (auth.uid() = user_id);

drop policy if exists "publish_manual_override_insert_own" on public.publish_manual_override_audit;
create policy "publish_manual_override_insert_own"
  on public.publish_manual_override_audit
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "publish_manual_override_delete_own" on public.publish_manual_override_audit;
create policy "publish_manual_override_delete_own"
  on public.publish_manual_override_audit
  for delete
  using (auth.uid() = user_id);
