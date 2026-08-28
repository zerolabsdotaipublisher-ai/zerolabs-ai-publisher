import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeVisibility(value: unknown): "public" | "private" {
  return value === "private" ? "private" : "public";
}

function normalizeSavedItemType(value: unknown): "post" | "website" | null {
  if (value === "post" || value === "website") {
    return value;
  }

  return null;
}

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
      const title = readString(payload?.title) ?? null;
      const body = readString(payload?.body);
      const visibility = normalizeVisibility(payload?.visibility);

      if (!body) {
        return NextResponse.json({ ok: false, error: "Post body cannot be empty." }, { status: 400 });
      }

      const { data, error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        title,
        body,
        visibility,
      }).select().single();

      if (error) throw error;
      return NextResponse.json({ ok: true, post: data });
    }

    if (action === "delete_post") {
      const postId = readString(payload?.postId);
      if (!postId) {
        return NextResponse.json({ ok: false, error: "Post id is required." }, { status: 400 });
      }

      const { error } = await supabase.from("community_posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle_website_visibility") {
      const websiteId = readString(payload?.websiteId);
      const visibility = normalizeVisibility(payload?.visibility);
      if (!websiteId) {
        return NextResponse.json({ ok: false, error: "Website id is required." }, { status: 400 });
      }

      const { error } = await supabase.from("website_structures").update({ visibility }).eq("id", websiteId).eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "save_item") {
       const itemId = readString(payload?.itemId);
       const itemType = normalizeSavedItemType(payload?.itemType);
       if (!itemId || !itemType) {
         return NextResponse.json({ ok: false, error: "A valid item id and item type are required." }, { status: 400 });
       }

       const { error } = await supabase.from("community_saved_items").insert({
         user_id: user.id,
         item_id: itemId,
         item_type: itemType
       });
       if (error) throw error;
       return NextResponse.json({ ok: true });
    }

    if (action === "unsave_item") {
       const itemId = readString(payload?.itemId);
       const itemType = normalizeSavedItemType(payload?.itemType);
       if (!itemId || !itemType) {
         return NextResponse.json({ ok: false, error: "A valid item id and item type are required." }, { status: 400 });
       }

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
