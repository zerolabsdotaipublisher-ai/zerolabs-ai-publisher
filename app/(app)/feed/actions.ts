"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { routes } from "@/config/routes";

export async function createCommunityPost(formData: FormData) {
  const user = await requireUser(routes.login);
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;
  const visibility = (formData.get("visibility") as string) || "public";

  if (!body || body.trim() === "") {
    return { error: "Post body cannot be empty" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title: title ? title.trim() : null,
    body: body.trim(),
    visibility,
  });

  if (error) {
    console.error("Error creating community post:", error);
    // Be graceful if table does not exist
    if (error.code === '42P01') {
       return { error: "Community posts are not available yet. Missing schema." };
    }
    return { error: "Failed to create post" };
  }

  revalidatePath(routes.feed);
  return { success: true };
}

export async function deleteCommunityPost(postId: string) {
  const user = await requireUser(routes.login);
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id); // RLS also protects this, but good to be explicit

  if (error) {
    console.error("Error deleting community post:", error);
    if (error.code === '42P01') {
       return { error: "Community posts are not available yet. Missing schema." };
    }
    return { error: "Failed to delete post" };
  }

  revalidatePath(routes.feed);
  return { success: true };
}
