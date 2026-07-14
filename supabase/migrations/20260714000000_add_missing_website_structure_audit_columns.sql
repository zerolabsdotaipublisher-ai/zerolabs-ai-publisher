-- Add the optional website_structures audit columns that are not present in
-- the minimum bootstrap schema.
--
-- This patch is intentionally idempotent:
-- - `add column if not exists` makes repeated runs safe
-- - the backfill only touches rows missing audit-user values
-- - `create index if not exists` makes index creation safe on reruns
-- - `notify pgrst, 'reload schema'` refreshes the PostgREST schema cache
--
-- The primary website_structures write path is code-compatible with the
-- minimum schema. This patch keeps the optional scalar audit/read-model fields
-- available for admin and compatibility queries.
--
-- `public.website_versions` already has every app-required column in the
-- current bootstrap schema, so no version-table column changes are needed here.

alter table if exists public.website_structures
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

do $$
begin
  if to_regclass('public.website_structures') is not null then
    update public.website_structures
       set created_by = coalesce(created_by, user_id),
           updated_by = coalesce(updated_by, user_id)
     where created_by is null
        or updated_by is null;
  end if;
end;
$$;

create index if not exists idx_website_structures_user_status_updated
  on public.website_structures(user_id, status, updated_at desc);

create index if not exists idx_website_structures_website_type_status
  on public.website_structures(website_type, status);

create index if not exists idx_website_structures_generated_at
  on public.website_structures(generated_at desc);

create index if not exists idx_website_structures_deleted_at
  on public.website_structures(deleted_at)
  where deleted_at is not null;

notify pgrst, 'reload schema';
