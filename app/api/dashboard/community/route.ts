import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServiceClient();

    const [websitesRes, postsRes, savedRes] = await Promise.all([
      supabase.from("website_structures").select("id, site_title, status, updated_at, user_id").eq("visibility", "public"),
      supabase.from("community_posts").select("id, title, body, created_at, updated_at, user_id").eq("visibility", "public").order('created_at', { ascending: false }),
      supabase.from("community_saved_items").select("item_id, item_type").eq("user_id", user.id)
    ]);

    // Fail safe missing tables check for backwards compat in case migration wasn't run
    if (postsRes.error && postsRes.error.code === '42P01') {
      return NextResponse.json({ ok: true, data: { websites: [], posts: [], savedItems: [] } });
    }

    if (postsRes.error) throw postsRes.error;
    if (savedRes.error) throw savedRes.error;

    return NextResponse.json({
      ok: true,
      data: {
         websites: websitesRes.data || [],
         posts: postsRes.data || [],
         savedItems: savedRes.data || []
      }
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Failed loading community data", { error: { message: errorMsg, name: "CommunityDataError" }, category: "error", service: "dashboard" });
    return NextResponse.json({ ok: false, error: "Could not load community feed", data: { websites: [], posts: [], savedItems: [] } }, { status: 200 }); // return empty data on fail safely
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, payload } = await req.json();
    const supabase = getSupabaseServiceClient();

    if (action === "create_post") {
      const { title, body, visibility } = payload;
      const { data, error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title,
        body,
        visibility: visibility || "public"
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ ok: true, post: data });
    }

    if (action === "delete_post") {
      const { postId } = payload;
      const { error } = await supabase.from("community_posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_website_visibility") {
      const { websiteId, visibility } = payload;
      const { error } = await supabase.from("website_structures").update({ visibility }).eq("id", websiteId).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "save_item") {
       const { itemId, itemType } = payload;
       const { error } = await supabase.from("community_saved_items").insert({
         user_id: user.id,
         item_id: itemId,
         item_type: itemType
       });
       if (error) throw error;
       return NextResponse.json({ ok: true });
    }

    if (action === "unsave_item") {
       const { itemId, itemType } = payload;
       const { error } = await supabase.from("community_saved_items").delete()
         .eq("user_id", user.id)
         .eq("item_id", itemId)
         .eq("item_type", itemType);
       if (error) throw error;
       return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Failed community action", { error: { message: errorMsg, name: "CommunityActionError" }, category: "error", service: "dashboard" });
    return NextResponse.json({ ok: false, error: "Action failed" }, { status: 500 });
  }
}
