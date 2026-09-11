-- Feed readers may resolve identity fields for authors of public community posts.
-- The application selects only id, username, full_name, first_name, and last_name.
DROP POLICY IF EXISTS "profiles_select_public_post_authors" ON public.profiles;
CREATE POLICY "profiles_select_public_post_authors"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_posts
      WHERE community_posts.user_id = profiles.id
        AND community_posts.visibility = 'public'
    )
  );
