-- Add a third, independently owned profile-media slot for page backgrounds.
-- This intentionally leaves the already-applied avatar/cover migration intact.

drop policy if exists "profile_media_background_select_own_v1" on storage.objects;
create policy "profile_media_background_select_own_v1"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] = 'background'
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_background_insert_own_v1" on storage.objects;
create policy "profile_media_background_insert_own_v1"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] = 'background'
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_background_update_own_v1" on storage.objects;
create policy "profile_media_background_update_own_v1"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] = 'background'
    and array_length(storage.foldername(name), 1) = 2
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] = 'background'
    and array_length(storage.foldername(name), 1) = 2
  );

drop policy if exists "profile_media_background_delete_own_v1" on storage.objects;
create policy "profile_media_background_delete_own_v1"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    and (storage.foldername(name))[2] = 'background'
    and array_length(storage.foldername(name), 1) = 2
  );
