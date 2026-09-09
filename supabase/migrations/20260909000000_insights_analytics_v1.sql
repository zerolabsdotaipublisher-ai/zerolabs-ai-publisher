-- Owner-scoped analytics foundation for Insights V1.
--
-- Website event ids intentionally use UUIDs so they can reference the
-- normalized website_projects model. Live routes resolve their legacy
-- website_structures id to that project id on the server before inserting.

CREATE TABLE IF NOT EXISTS public.website_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  website_id uuid NOT NULL,
  source text NULL,
  pathname text NULL,
  referrer text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NULL,
  pathname text NULL,
  referrer text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'heart',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, website_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.website_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  website_id uuid NOT NULL,
  share_target text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_view_events_owner_created_at_idx
  ON public.website_view_events (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS profile_view_events_owner_created_at_idx
  ON public.profile_view_events (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS website_reactions_owner_created_at_idx
  ON public.website_reactions (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS website_shares_owner_created_at_idx
  ON public.website_shares (owner_user_id, created_at DESC);

ALTER TABLE public.website_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_view_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_shares ENABLE ROW LEVEL SECURITY;

-- Owners can only read their own aggregate event rows through the application.
DROP POLICY IF EXISTS "website_view_events_select_owner" ON public.website_view_events;
CREATE POLICY "website_view_events_select_owner" ON public.website_view_events
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "profile_view_events_select_owner" ON public.profile_view_events;
CREATE POLICY "profile_view_events_select_owner" ON public.profile_view_events
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "website_reactions_select_owner" ON public.website_reactions;
CREATE POLICY "website_reactions_select_owner" ON public.website_reactions
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "website_shares_select_owner" ON public.website_shares;
CREATE POLICY "website_shares_select_owner" ON public.website_shares
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Direct authenticated inserts are tightly scoped to the signed-in user.
-- Public live-route events are inserted server-side after the owner and
-- normalized project id have been resolved; no browser service-role client is
-- involved. Future reaction/share server actions can use the same path.
DROP POLICY IF EXISTS "website_view_events_insert_authenticated_owner" ON public.website_view_events;
CREATE POLICY "website_view_events_insert_authenticated_owner" ON public.website_view_events
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND viewer_user_id = auth.uid());

DROP POLICY IF EXISTS "profile_view_events_insert_authenticated_owner" ON public.profile_view_events;
CREATE POLICY "profile_view_events_insert_authenticated_owner" ON public.profile_view_events
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND viewer_user_id = auth.uid());

DROP POLICY IF EXISTS "website_reactions_insert_authenticated_owner" ON public.website_reactions;
CREATE POLICY "website_reactions_insert_authenticated_owner" ON public.website_reactions
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND user_id = auth.uid());

DROP POLICY IF EXISTS "website_shares_insert_authenticated_owner" ON public.website_shares;
CREATE POLICY "website_shares_insert_authenticated_owner" ON public.website_shares
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid() AND user_id = auth.uid());
