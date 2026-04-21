create table if not exists public.website_versions (
  id text primary key,
  structure_id text not null references public.website_structures(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  label text not null,
  status text not null,
  source text not null,
  structure_version integer not null,
  snapshot jsonb not null,
  fingerprint jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  deployment jsonb,
  comparison jsonb,
  is_live boolean not null default false,
  is_current_draft boolean not null default false,
  restored_from_version_id text references public.website_versions(id) on delete set null,
  audit jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (structure_id, version_number)
);

create index if not exists website_versions_structure_created_idx
  on public.website_versions (structure_id, created_at desc);
create index if not exists website_versions_structure_live_idx
  on public.website_versions (structure_id, is_live);
create index if not exists website_versions_structure_current_idx
  on public.website_versions (structure_id, is_current_draft);

alter table public.website_versions enable row level security;

drop trigger if exists set_website_versions_updated_at on public.website_versions;
create trigger set_website_versions_updated_at
  before update on public.website_versions
  for each row
  execute function public.set_updated_at();

drop policy if exists "website_versions_select_own" on public.website_versions;
create policy "website_versions_select_own"
  on public.website_versions
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_versions_insert_own" on public.website_versions;
create policy "website_versions_insert_own"
  on public.website_versions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_versions_update_own" on public.website_versions;
create policy "website_versions_update_own"
  on public.website_versions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_versions_delete_own" on public.website_versions;
create policy "website_versions_delete_own"
  on public.website_versions
  for delete
  using (auth.uid() = user_id);

create or replace function public.insert_website_version(
  p_id text,
  p_structure_id text,
  p_user_id uuid,
  p_label text,
  p_status text,
  p_source text,
  p_structure_version integer,
  p_is_live boolean,
  p_is_current_draft boolean,
  p_snapshot jsonb,
  p_fingerprint jsonb,
  p_summary jsonb,
  p_deployment jsonb default null,
  p_comparison jsonb default null,
  p_restored_from_version_id text default null,
  p_audit jsonb default '[]'::jsonb,
  p_created_at timestamptz default now()
)
returns public.website_versions
language plpgsql
as $$
declare
  v_version_number integer;
  v_row public.website_versions;
begin
  perform pg_advisory_xact_lock(hashtext(p_structure_id));

  if p_is_live then
    update public.website_versions
      set is_live = false,
          status = case when status = 'published' then 'archived' else status end,
          updated_at = p_created_at
      where structure_id = p_structure_id
        and is_live = true;
  end if;

  if p_is_current_draft then
    update public.website_versions
      set is_current_draft = false,
          status = case when status in ('draft', 'restored') then 'archived' else status end,
          updated_at = p_created_at
      where structure_id = p_structure_id
        and is_current_draft = true;
  end if;

  select coalesce(max(version_number), 0) + 1
    into v_version_number
    from public.website_versions
   where structure_id = p_structure_id;

  insert into public.website_versions (
    id,
    structure_id,
    user_id,
    version_number,
    label,
    status,
    source,
    structure_version,
    snapshot,
    fingerprint,
    summary,
    deployment,
    comparison,
    is_live,
    is_current_draft,
    restored_from_version_id,
    audit,
    created_at,
    updated_at
  )
  values (
    p_id,
    p_structure_id,
    p_user_id,
    v_version_number,
    p_label,
    p_status,
    p_source,
    p_structure_version,
    p_snapshot,
    p_fingerprint,
    p_summary,
    p_deployment,
    p_comparison,
    p_is_live,
    p_is_current_draft,
    p_restored_from_version_id,
    p_audit,
    p_created_at,
    p_created_at
  )
  returning * into v_row;

  return v_row;
end;
$$;
