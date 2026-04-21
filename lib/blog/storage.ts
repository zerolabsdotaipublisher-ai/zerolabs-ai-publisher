import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { BlogPostRow, GeneratedBlogPost } from "./types";

function toRow(blog: GeneratedBlogPost, userId: string): BlogPostRow {
  return {
    id: blog.id,
    structure_id: blog.structureId,
    user_id: userId,
    title: blog.title,
    slug: blog.slug,
    blog_json: blog,
    source_input: blog.sourceInput,
    version: blog.version,
    generated_at: blog.generatedAt,
    updated_at: blog.updatedAt,
  } as BlogPostRow;
}

function fromRow(row: BlogPostRow): GeneratedBlogPost {
  return row.blog_json as GeneratedBlogPost;
}

export async function upsertBlogPost(blog: GeneratedBlogPost, userId: string): Promise<GeneratedBlogPost> {
  const supabase = getSupabaseServiceClient();
  const row = toRow(blog, userId);

  const { error } = await supabase.from("blog_posts").upsert(row, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store blog post", {
      category: "error",
      service: "supabase",
      structureId: blog.structureId,
      error: { name: "BlogStorageError", message: error.message },
    });
    throw error;
  }

  return blog;
}

export async function getBlogPostByStructureId(
  structureId: string,
  userId: string,
): Promise<GeneratedBlogPost | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;

    logger.error("Failed to load blog post", {
      category: "error",
      service: "supabase",
      structureId,
      error: { name: "BlogStorageError", message: error.message },
    });
    throw error;
  }

  return fromRow(data as BlogPostRow);
}

export async function deleteBlogPostByStructureId(
  structureId: string,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("structure_id", structureId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to delete blog post", {
      category: "error",
      service: "supabase",
      structureId,
      error: { name: "BlogStorageError", message: error.message },
    });
    throw error;
  }
}
