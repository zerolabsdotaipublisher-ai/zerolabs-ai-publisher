-- Add visibility to website_structures
ALTER TABLE public.website_structures ADD COLUMN IF NOT EXISTS visibility text not null default 'private';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'website_structures_visibility_check'
  ) THEN
    ALTER TABLE public.website_structures ADD CONSTRAINT website_structures_visibility_check CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

-- Update RLS to allow reading public websites
DROP POLICY IF EXISTS "structures_select_public" ON public.website_structures;
CREATE POLICY "structures_select_public" ON public.website_structures
  FOR SELECT USING (visibility = 'public');

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER set_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "community_posts_select_own" ON public.community_posts;
CREATE POLICY "community_posts_select_own" ON public.community_posts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_posts_select_public" ON public.community_posts;
CREATE POLICY "community_posts_select_public" ON public.community_posts FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "community_posts_insert_own" ON public.community_posts;
CREATE POLICY "community_posts_insert_own" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_posts_update_own" ON public.community_posts;
CREATE POLICY "community_posts_update_own" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_posts_delete_own" ON public.community_posts;
CREATE POLICY "community_posts_delete_own" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Community Saved Items
CREATE TABLE IF NOT EXISTS public.community_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('post', 'website')),
  item_id text not null,
  created_at timestamptz not null default now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.community_saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_items_select_own" ON public.community_saved_items;
CREATE POLICY "saved_items_select_own" ON public.community_saved_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_items_insert_own" ON public.community_saved_items;
CREATE POLICY "saved_items_insert_own" ON public.community_saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_items_delete_own" ON public.community_saved_items;
CREATE POLICY "saved_items_delete_own" ON public.community_saved_items FOR DELETE USING (auth.uid() = user_id);
