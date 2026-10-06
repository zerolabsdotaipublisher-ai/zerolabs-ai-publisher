-- Slice 3B only: disposable Supabase-compatible integration schema.
-- This is never a production migration. The caller must pass the environment
-- gate in tests/integration/support/isolated-environment.ts before running it.

do $$
begin
  if to_regprocedure('auth.uid()') is null then
    raise exception 'zero_slice3b requires Supabase auth.uid()';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon')
    or not exists (select 1 from pg_roles where rolname = 'authenticated')
    or not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'zero_slice3b requires Supabase anon, authenticated, and service_role roles';
  end if;
end;
$$;

drop function if exists public.save_editor_document(uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb);
drop function if exists public.zero_slice3b_seed_structure(uuid, uuid, jsonb);
drop function if exists public.zero_slice3b_set_failpoint(uuid, text);
drop function if exists public.zero_slice3b_clear_failpoint(uuid);
drop function if exists public.zero_slice3b_legacy_touch(uuid);
drop function if exists public.zero_slice3b_read_state(uuid);
drop function if exists public.zero_slice3b_security_contract();
drop schema if exists zero_slice3b cascade;

create schema zero_slice3b;
revoke all on schema zero_slice3b from public;
grant usage on schema zero_slice3b to authenticated, service_role;

create table zero_slice3b.website_structures (
  id uuid primary key,
  user_id uuid not null,
  structure jsonb not null,
  editor_document jsonb,
  editor_revision bigint not null default 0 check (editor_revision >= 0),
  version bigint not null default 1 check (version >= 1),
  updated_at timestamptz not null default now()
);

create table zero_slice3b.website_navigation (
  structure_id uuid primary key references zero_slice3b.website_structures(id) on delete cascade,
  user_id uuid not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table zero_slice3b.website_seo_metadata (
  id text primary key,
  structure_id uuid not null references zero_slice3b.website_structures(id) on delete cascade,
  user_id uuid not null,
  page_slug text not null,
  metadata_json jsonb not null,
  artifact_row jsonb not null,
  updated_at timestamptz not null default now()
);

create table zero_slice3b.website_versions (
  structure_id uuid not null references zero_slice3b.website_structures(id) on delete cascade,
  version bigint not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  primary key (structure_id, version)
);

create table zero_slice3b.failpoints (
  structure_id uuid primary key references zero_slice3b.website_structures(id) on delete cascade,
  stage text not null check (stage in ('structure', 'navigation', 'seo', 'version'))
);

alter table zero_slice3b.website_structures enable row level security;
alter table zero_slice3b.website_navigation enable row level security;
alter table zero_slice3b.website_seo_metadata enable row level security;
alter table zero_slice3b.website_versions enable row level security;
alter table zero_slice3b.failpoints enable row level security;

create policy zero_slice3b_structure_owner on zero_slice3b.website_structures
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy zero_slice3b_navigation_owner on zero_slice3b.website_navigation
  for all to authenticated
  using (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ));

create policy zero_slice3b_seo_owner on zero_slice3b.website_seo_metadata
  for all to authenticated
  using (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ));

create policy zero_slice3b_version_owner on zero_slice3b.website_versions
  for all to authenticated
  using (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from zero_slice3b.website_structures structures
    where structures.id = structure_id and structures.user_id = auth.uid()
  ));

create or replace function zero_slice3b.bump_legacy_editor_revision()
returns trigger
language plpgsql
set search_path = pg_catalog, zero_slice3b
as $$
begin
  if new.editor_revision = old.editor_revision then
    new.editor_revision := old.editor_revision + 1;
  end if;
  return new;
end;
$$;

create trigger zero_slice3b_bump_legacy_editor_revision
before update on zero_slice3b.website_structures
for each row execute function zero_slice3b.bump_legacy_editor_revision();

create or replace function zero_slice3b.fail_structure_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, zero_slice3b
as $$
begin
  if exists (select 1 from zero_slice3b.failpoints where structure_id = new.id and stage = 'structure') then
    raise exception 'zero_slice3b injected structure failure' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function zero_slice3b.fail_child_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, zero_slice3b
as $$
begin
  if exists (select 1 from zero_slice3b.failpoints where structure_id = new.structure_id and stage = tg_argv[0]) then
    raise exception 'zero_slice3b injected % failure', tg_argv[0] using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger zero_slice3b_fail_structure_write
before update on zero_slice3b.website_structures
for each row execute function zero_slice3b.fail_structure_write();

create trigger zero_slice3b_fail_navigation_insert
before insert on zero_slice3b.website_navigation
for each row execute function zero_slice3b.fail_child_insert('navigation');

create trigger zero_slice3b_fail_seo_insert
before insert on zero_slice3b.website_seo_metadata
for each row execute function zero_slice3b.fail_child_insert('seo');

create trigger zero_slice3b_fail_version_insert
before insert on zero_slice3b.website_versions
for each row execute function zero_slice3b.fail_child_insert('version');

grant select, update on zero_slice3b.website_structures to authenticated;
grant select, insert, update, delete on zero_slice3b.website_navigation to authenticated;
grant select, insert, update, delete on zero_slice3b.website_seo_metadata to authenticated;
grant select, insert on zero_slice3b.website_versions to authenticated;

create or replace function public.save_editor_document(
  p_structure_id uuid,
  p_expected_revision bigint,
  p_document jsonb,
  p_compatibility_structure jsonb,
  p_navigation jsonb,
  p_seo_rows jsonb,
  p_snapshot jsonb
)
returns table(status text, editor_revision bigint, version bigint)
language plpgsql
security invoker
set search_path = pg_catalog, public, zero_slice3b
as $$
declare
  current_structure zero_slice3b.website_structures%rowtype;
  next_version bigint;
  seo_row jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select * into current_structure
  from zero_slice3b.website_structures
  where id = p_structure_id
  for update;

  if not found then
    raise exception 'structure not found or not owned' using errcode = 'P0002';
  end if;
  if p_expected_revision is null or p_expected_revision <> current_structure.editor_revision then
    return query select 'conflict'::text, current_structure.editor_revision, current_structure.version;
    return;
  end if;
  if jsonb_typeof(p_document) <> 'object'
    or p_document ->> 'schemaVersion' <> '1'
    or p_document #>> '{compatibility,structureId}' <> p_structure_id::text then
    raise exception 'invalid canonical editor document' using errcode = '22023';
  end if;
  if jsonb_typeof(p_compatibility_structure) <> 'object'
    or p_compatibility_structure ->> 'id' <> p_structure_id::text
    or p_compatibility_structure ->> 'userId' <> current_structure.user_id::text
    or jsonb_typeof(p_navigation) <> 'object'
    or jsonb_typeof(p_seo_rows) <> 'array'
    or jsonb_typeof(p_snapshot) <> 'object'
    or p_snapshot ->> 'schemaVersion' <> '2'
    or p_snapshot -> 'canonicalDocument' <> p_document
    or p_snapshot -> 'structure' <> p_compatibility_structure then
    raise exception 'invalid editor persistence artifacts' using errcode = '22023';
  end if;

  next_version := current_structure.version + 1;
  update zero_slice3b.website_structures
  set structure = p_compatibility_structure,
      editor_document = p_document,
      editor_revision = current_structure.editor_revision + 1,
      version = next_version,
      updated_at = now()
  where id = p_structure_id;

  delete from zero_slice3b.website_navigation where structure_id = p_structure_id;
  insert into zero_slice3b.website_navigation (structure_id, user_id, payload)
  values (p_structure_id, current_structure.user_id, p_navigation);

  delete from zero_slice3b.website_seo_metadata where structure_id = p_structure_id;
  for seo_row in select value from jsonb_array_elements(p_seo_rows)
  loop
    if seo_row ->> 'id' is null or seo_row ->> 'page_slug' is null or seo_row -> 'metadata_json' is null then
      raise exception 'invalid editor SEO artifact row' using errcode = '22023';
    end if;
    insert into zero_slice3b.website_seo_metadata (id, structure_id, user_id, page_slug, metadata_json, artifact_row)
    values (
      seo_row ->> 'id',
      p_structure_id,
      current_structure.user_id,
      seo_row ->> 'page_slug',
      seo_row -> 'metadata_json',
      seo_row
    );
  end loop;

  insert into zero_slice3b.website_versions (structure_id, version, snapshot)
  values (p_structure_id, next_version, p_snapshot);

  return query select 'saved'::text, current_structure.editor_revision + 1, next_version;
end;
$$;

revoke all on function public.save_editor_document(uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb) from public, anon, service_role;
grant execute on function public.save_editor_document(uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;

create or replace function public.zero_slice3b_seed_structure(p_id uuid, p_user_id uuid, p_structure jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, zero_slice3b
as $$
begin
  delete from zero_slice3b.website_structures where id = p_id;
  insert into zero_slice3b.website_structures (id, user_id, structure, editor_document, editor_revision, version)
  values (p_id, p_user_id, p_structure, null, 0, 1);
end;
$$;

create or replace function public.zero_slice3b_set_failpoint(p_structure_id uuid, p_stage text)
returns void
language sql
security definer
set search_path = pg_catalog, public, zero_slice3b
as $$
  insert into zero_slice3b.failpoints (structure_id, stage) values (p_structure_id, p_stage)
  on conflict (structure_id) do update set stage = excluded.stage;
$$;

create or replace function public.zero_slice3b_clear_failpoint(p_structure_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog, public, zero_slice3b
as $$
  delete from zero_slice3b.failpoints where structure_id = p_structure_id;
$$;

create or replace function public.zero_slice3b_legacy_touch(p_structure_id uuid)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, zero_slice3b
as $$
declare
  revision bigint;
begin
  update zero_slice3b.website_structures
  set structure = jsonb_set(structure, '{legacyWrite}', to_jsonb(now()::text), true), updated_at = now()
  where id = p_structure_id
  returning editor_revision into revision;
  return revision;
end;
$$;

create or replace function public.zero_slice3b_read_state(p_structure_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, zero_slice3b
as $$
  select jsonb_build_object(
    'structure', (
      select jsonb_build_object(
        'structure', structure,
        'editorDocument', editor_document,
        'editorRevision', editor_revision,
        'version', version
      )
      from zero_slice3b.website_structures where id = p_structure_id
    ),
    'navigation', (
      select payload from zero_slice3b.website_navigation where structure_id = p_structure_id
    ),
    'seo', coalesce((
      select jsonb_agg(artifact_row order by id)
      from zero_slice3b.website_seo_metadata where structure_id = p_structure_id
    ), '[]'::jsonb),
    'versions', coalesce((
      select jsonb_agg(snapshot order by version)
      from zero_slice3b.website_versions where structure_id = p_structure_id
    ), '[]'::jsonb)
  );
$$;

create or replace function public.zero_slice3b_security_contract()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'securityDefiner', procedures.prosecdef,
    'anonCanExecute', has_function_privilege('anon', procedures.oid, 'execute'),
    'authenticatedCanExecute', has_function_privilege('authenticated', procedures.oid, 'execute')
  )
  from pg_proc procedures
  where procedures.oid = 'public.save_editor_document(uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb)'::regprocedure;
$$;

revoke all on function public.zero_slice3b_seed_structure(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.zero_slice3b_set_failpoint(uuid, text) from public, anon, authenticated;
revoke all on function public.zero_slice3b_clear_failpoint(uuid) from public, anon, authenticated;
revoke all on function public.zero_slice3b_legacy_touch(uuid) from public, anon, authenticated;
revoke all on function public.zero_slice3b_read_state(uuid) from public, anon, authenticated;
revoke all on function public.zero_slice3b_security_contract() from public, anon, authenticated;
grant execute on function public.zero_slice3b_seed_structure(uuid, uuid, jsonb) to service_role;
grant execute on function public.zero_slice3b_set_failpoint(uuid, text) to service_role;
grant execute on function public.zero_slice3b_clear_failpoint(uuid) to service_role;
grant execute on function public.zero_slice3b_legacy_touch(uuid) to service_role;
grant execute on function public.zero_slice3b_read_state(uuid) to service_role;
grant execute on function public.zero_slice3b_security_contract() to service_role;

notify pgrst, 'reload schema';
