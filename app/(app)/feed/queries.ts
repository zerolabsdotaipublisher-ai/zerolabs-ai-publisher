import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getCommunityFeed() {
  const supabase = await getSupabaseServerClient();

  // Since RLS is enabled, we just query all posts we have access to
  // RLS policies for community_posts:
  // "community_posts_select_own" - USING (auth.uid() = user_id)
  // "community_posts_select_public" - USING (visibility = 'public')

  const { data: posts, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      author:user_id(
        id,
        raw_user_meta_data
      )
    `)
    .order("created_at", { ascending: false });

  // Handle missing tables safely
  if (error && error.code === '42P01') {
    return [];
  }

  if (error) {
    console.error("Error fetching community feed:", error);
    return [];
  }

  return posts || [];
}

export async function getPublicWebsites() {
  const supabase = await getSupabaseServerClient();

  // RLS policy:
  // "structures_select_public" - USING (visibility = 'public')

  const { data: websites, error } = await supabase
    .from("website_structures")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error && error.code === '42P01') {
    return [];
  }

  if (error) {
    console.error("Error fetching public websites:", error);
    return [];
  }

  return websites || [];
}
