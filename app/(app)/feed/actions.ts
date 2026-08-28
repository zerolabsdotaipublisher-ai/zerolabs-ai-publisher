"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isMissingFeedSchema(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "42501" || error?.code === "PGRST205" || error?.message?.toLowerCase().includes("schema cache") === true;
}

function logFeedActionError(label: string, error: { message?: string } | null) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`Feed action unavailable: ${label}${error?.message ? ` (${error.message})` : ""}`);
  }
}

function normalizeVisibility(value: FormDataEntryValue | null): "public" | "private" {
  return value === "private" ? "private" : "public";
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getAttachmentType(postType: string): "image" | "gif" | "video" | "document" | "code" | "project" | null {
  if (postType === "image") return "image";
  if (postType === "gif") return "gif";
  if (postType === "video") return "video";
  if (postType === "docs") return "document";
  if (postType === "code") return "code";
  if (postType === "project" || postType === "website") return "project";
  return null;
}

const maxAttachmentSize = 50 * 1024 * 1024;

function isAllowedAttachment(file: File, type: string): boolean {
  if (!file.size || file.size > maxAttachmentSize) return false;
  if (type === "image") return file.type.startsWith("image/") && file.type !== "image/gif";
  if (type === "gif") return file.type === "image/gif";
  if (type === "video") return file.type.startsWith("video/");
  if (type === "document") return file.type === "application/pdf" || file.type.startsWith("text/") || file.type.includes("document") || file.type.includes("spreadsheet");
  return true;
}

async function insertAttachment(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, postId: string, userId: string, type: string, file: File, metadata: Record<string, unknown> = {}) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "attachment";
  const storagePath = `${userId}/${postId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("community-attachments").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (upload.error) throw new Error("Upload failed.");

  const { error } = await supabase.from("community_post_attachments").insert({
    post_id: postId,
    user_id: userId,
    attachment_type: type,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    metadata,
  });

  if (error) throw error;
}

export async function createCommunityPost(formData: FormData) {
  const user = await requireUser(routes.feed);
  const title = readText(formData, "title");
  const body = readText(formData, "body");
  const postType = readText(formData, "post_type") || "text";
  const visibility = normalizeVisibility(formData.get("visibility"));

  if (postType === "text" && !body) {
    return { error: "Post body is required." };
  }

  const attachmentType = getAttachmentType(postType);
  const fileEntry = formData.get("attachment");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (attachmentType && attachmentType !== "project" && attachmentType !== "code" && !file) return { error: "Select a file before posting." };
  if (file && attachmentType && !isAllowedAttachment(file, attachmentType)) return { error: "This file type or size is not supported." };

  const supabase = await getSupabaseServerClient();
  const { data: post, error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title: title || null,
    body: body || (postType === "website" ? "Shared website" : postType),
    visibility,
  }).select("id").single();

  if (error) {
    logFeedActionError("create post", error);
    if (isMissingFeedSchema(error)) {
      return { error: "Feed tables are not configured." };
    }

    return { error: "Feed tables are not configured." };
  }

  try {
    if (file && attachmentType) await insertAttachment(supabase, post.id, user.id, attachmentType, file, { post_type: postType });
    if (postType === "code" && !file) {
      const { error: codeError } = await supabase.from("community_post_attachments").insert({
        post_id: post.id,
        user_id: user.id,
        attachment_type: "code",
        storage_path: `code:${crypto.randomUUID()}`,
        metadata: { post_type: "code", code: body },
      });
      if (codeError) throw codeError;
    }
    if (postType === "project") {
      const projectUrl = readText(formData, "project_url");
      if (!/^https?:\/\//i.test(projectUrl)) return { error: "Enter a valid project link." };
      await supabase.from("community_post_attachments").insert({
        post_id: post.id,
        user_id: user.id,
        attachment_type: "project",
        storage_path: `link:${projectUrl}`,
        public_url: projectUrl,
        metadata: { kind: "project-link" },
      });
    }
    if (postType === "website") {
      const websiteId = readText(formData, "website_id");
      if (!websiteId) return { error: "Select a website before posting." };
      const { data: website } = await supabase.from("website_structures").select("id, site_title").eq("id", websiteId).eq("user_id", user.id).maybeSingle();
      if (!website) return { error: "You are not allowed to share this website." };
      await supabase.from("community_post_attachments").insert({
        post_id: post.id,
        user_id: user.id,
        attachment_type: "project",
        storage_path: `website:${website.id}`,
        file_name: website.site_title,
        metadata: { website_id: website.id, kind: "generated-website" },
      });
    }
  } catch (attachmentError) {
    logFeedActionError("create attachment", attachmentError instanceof Error ? attachmentError : null);
    return { error: attachmentError instanceof Error && attachmentError.message === "Upload failed." ? "Upload failed." : "Feed attachments are not configured." };
  }

  revalidatePath(routes.feed);
  return { success: true };
}

export async function toggleCommunityPostReaction(postId: string, reacted: boolean) {
  const user = await requireUser(routes.feed);
  const supabase = await getSupabaseServerClient();
  const result = reacted
    ? await supabase.from("community_post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("reaction_type", "heart")
    : await supabase.from("community_post_reactions").insert({ post_id: postId, user_id: user.id, reaction_type: "heart" });
  if (result.error) return { error: isMissingFeedSchema(result.error) ? "Feed reactions are not configured." : "Unable to save reaction." };
  revalidatePath(routes.feed);
  return { success: true };
}

export async function createCommunityPostComment(formData: FormData) {
  const user = await requireUser(routes.feed);
  const postId = readText(formData, "post_id");
  const body = readText(formData, "body");
  if (!body) return { error: "Comment text is required." };
  const supabase = await getSupabaseServerClient();
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, user_id, visibility")
    .eq("id", postId)
    .maybeSingle();
  if (!post || (post.visibility !== "public" && post.user_id !== user.id)) {
    return { error: "You are not allowed to comment on this post." };
  }
  const { error } = await supabase.from("community_post_comments").insert({ post_id: postId, user_id: user.id, body });
  if (error) return { error: isMissingFeedSchema(error) ? "Feed comments are not configured." : "Unable to add comment." };
  revalidatePath(routes.feed);
  return { success: true };
}

export async function shareCommunityPost(postId: string) {
  const user = await requireUser(routes.feed);
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("community_post_shares").insert({ post_id: postId, user_id: user.id, share_target: "internal" });
  if (error) return { error: isMissingFeedSchema(error) ? "Feed sharing is not configured." : "Unable to record share." };
  revalidatePath(routes.feed);
  return { success: true };
}

export async function deleteCommunityPost(postId: string) {
  const user = await requireUser(routes.feed);
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id);

  if (error) {
    logFeedActionError("delete post", error);
    if (isMissingFeedSchema(error)) {
      return { error: "Community posts are not available yet. Apply the community feed migration first." };
    }

    return { error: "Failed to delete post." };
  }

  revalidatePath(routes.feed);
  return { success: true };
}

export async function toggleSavedCommunityPost(postId: string, save: boolean) {
  const user = await requireUser(routes.feed);
  const supabase = await getSupabaseServerClient();

  const mutation = save
    ? supabase.from("community_saved_items").insert({
        user_id: user.id,
        item_id: postId,
        item_type: "post",
      })
    : supabase
        .from("community_saved_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", postId)
        .eq("item_type", "post");

  const { error } = await mutation;
  if (error) {
    logFeedActionError("save post", error);
    if (isMissingFeedSchema(error)) {
      return { error: "Saved posts are not available yet. Apply the community feed migration first." };
    }

    if (save && error.code === "23505") {
      revalidatePath(routes.feed);
      return { success: true };
    }

    return { error: save ? "Failed to save post." : "Failed to remove saved post." };
  }

  revalidatePath(routes.feed);
  return { success: true };
}
