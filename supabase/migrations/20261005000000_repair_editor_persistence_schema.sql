-- Drift repair for the website editor Save Draft persistence path.
--
-- The configured project contains website_structures and website_versions but
-- is missing the navigation and SEO artifact tables expected by the editor.
-- This migration is intentionally narrow: it creates or reconciles only the
-- two missing artifact schemas. It does not modify website_structures,
-- website_versions, user data, or unrelated generated-content tables.
--
-- All operations are additive/idempotent where PostgreSQL supports that
-- directly. Existing policies and triggers are left in place; RLS is never
-- disabled or weakened.

create table if not exists public.website_navigation (
  id              text        primary key,
  structure_id    text        not null references public.website_structures(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  hierarchy_json  jsonb       not null,
  navigation_json jsonb       not null,
  version         integer     not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.website_seo_metadata (
  id                   text        primary key,
  structure_id         text        not null references public.website_structures(id) on delete cascade,
  user_id              uuid        not null references auth.users(id) on delete cascade,
  page_slug            text        not null,
  metadata_json        jsonb       not null,
  generated_from_input jsonb       not null,
  version              integer     not null default 1,
  content_status       text        not null default 'generated',
  created_by           uuid        references auth.users(id) on delete set null,
  updated_by           uuid        references auth.users(id) on delete set null,
  archived_at          timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint website_seo_metadata_status_check
    check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'))
);

-- Reconcile only the SEO lifecycle/audit columns introduced after the base
-- table migration. This preserves rows if an older base table already exists.
alter table public.website_seo_metadata
  add column if not exists content_status text not null default 'generated',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- A pre-existing drifted table is reconciled only when its required keys are
-- absent. If existing data violates a required key, PostgreSQL aborts safely
-- rather than altering or discarding that data.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_navigation'::regclass
       and contype = 'p'
  ) then
    alter table public.website_navigation
      add constraint website_navigation_pkey primary key (id);
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_navigation'::regclass
       and conname = 'website_navigation_structure_id_fkey'
  ) then
    alter table public.website_navigation
      add constraint website_navigation_structure_id_fkey
      foreign key (structure_id) references public.website_structures(id) on delete cascade;
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_navigation'::regclass
       and conname = 'website_navigation_user_id_fkey'
  ) then
    alter table public.website_navigation
      add constraint website_navigation_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_seo_metadata'::regclass
       and contype = 'p'
  ) then
    alter table public.website_seo_metadata
      add constraint website_seo_metadata_pkey primary key (id);
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_seo_metadata'::regclass
       and conname = 'website_seo_metadata_structure_id_fkey'
  ) then
    alter table public.website_seo_metadata
      add constraint website_seo_metadata_structure_id_fkey
      foreign key (structure_id) references public.website_structures(id) on delete cascade;
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_seo_metadata'::regclass
       and conname = 'website_seo_metadata_user_id_fkey'
  ) then
    alter table public.website_seo_metadata
      add constraint website_seo_metadata_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.website_seo_metadata'::regclass
       and conname = 'website_seo_metadata_status_check'
  ) then
    alter table public.website_seo_metadata
      add constraint website_seo_metadata_status_check
      check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));
  end if;
end;
$$;

create index if not exists idx_website_navigation_structure
  on public.website_navigation(structure_id);

create index if not exists idx_website_navigation_user
  on public.website_navigation(user_id);

create unique index if not exists uq_website_navigation_version
  on public.website_navigation(structure_id, version);

create index if not exists idx_website_seo_metadata_structure
  on public.website_seo_metadata(structure_id);

create index if not exists idx_website_seo_metadata_user
  on public.website_seo_metadata(user_id);

create unique index if not exists uq_website_seo_metadata_lookup
  on public.website_seo_metadata(structure_id, page_slug, version);

create index if not exists idx_website_seo_metadata_user_status
  on public.website_seo_metadata(user_id, content_status, updated_at desc);

create index if not exists idx_website_seo_metadata_deleted_at
  on public.website_seo_metadata(deleted_at)
  where deleted_at is not null;

alter table public.website_navigation enable row level security;
alter table public.website_seo_metadata enable row level security;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Cannot repair editor persistence schema: public.set_updated_at() is missing.';
  end if;

  if not exists (
    select 1
      from pg_trigger
     where tgrelid = 'public.website_navigation'::regclass
       and tgname = 'set_website_navigation_updated_at'
       and not tgisinternal
  ) then
    execute 'create trigger set_website_navigation_updated_at before update on public.website_navigation for each row execute function public.set_updated_at()';
  end if;

  if not exists (
    select 1
      from pg_trigger
     where tgrelid = 'public.website_seo_metadata'::regclass
       and tgname = 'set_website_seo_metadata_updated_at'
       and not tgisinternal
  ) then
    execute 'create trigger set_website_seo_metadata_updated_at before update on public.website_seo_metadata for each row execute function public.set_updated_at()';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_navigation'
       and policyname = 'website_navigation_select_own'
  ) then
    execute 'create policy "website_navigation_select_own" on public.website_navigation for select using (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_navigation'
       and policyname = 'website_navigation_insert_own'
  ) then
    execute 'create policy "website_navigation_insert_own" on public.website_navigation for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_navigation'
       and policyname = 'website_navigation_update_own'
  ) then
    execute 'create policy "website_navigation_update_own" on public.website_navigation for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_navigation'
       and policyname = 'website_navigation_delete_own'
  ) then
    execute 'create policy "website_navigation_delete_own" on public.website_navigation for delete using (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_seo_metadata'
       and policyname = 'website_seo_metadata_select_own'
  ) then
    execute 'create policy "website_seo_metadata_select_own" on public.website_seo_metadata for select using (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_seo_metadata'
       and policyname = 'website_seo_metadata_insert_own'
  ) then
    execute 'create policy "website_seo_metadata_insert_own" on public.website_seo_metadata for insert with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_seo_metadata'
       and policyname = 'website_seo_metadata_update_own'
  ) then
    execute 'create policy "website_seo_metadata_update_own" on public.website_seo_metadata for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;

  if not exists (
    select 1 from pg_policies
     where schemaname = 'public'
       and tablename = 'website_seo_metadata'
       and policyname = 'website_seo_metadata_delete_own'
  ) then
    execute 'create policy "website_seo_metadata_delete_own" on public.website_seo_metadata for delete using (auth.uid() = user_id)';
  end if;
end;
$$;

-- Make the newly created tables visible to PostgREST before editor traffic
-- attempts another Save Draft request.
notify pgrst, 'reload schema';
