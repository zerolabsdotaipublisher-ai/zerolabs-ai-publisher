-- Dedicated private Supabase Storage for authenticated profile avatars and covers.
-- Object keys are server-generated as {auth user id}/{avatar|cover}/profile-... .
-- This migration is intentionally additive and safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_media_select_own_v1" on storage.objects;
create policy "profile_media_select_own_v1"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] in ('avatar', 'cover')
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_insert_own_v1" on storage.objects;
create policy "profile_media_insert_own_v1"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] in ('avatar', 'cover')
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_update_own_v1" on storage.objects;
create policy "profile_media_update_own_v1"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] in ('avatar', 'cover')
    and array_length(storage.foldername(name), 1) = 2
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] in ('avatar', 'cover')
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_delete_own_v1" on storage.objects;
create policy "profile_media_delete_own_v1"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] in ('avatar', 'cover')
    and array_length(storage.foldername(name), 1) = 2
  );
