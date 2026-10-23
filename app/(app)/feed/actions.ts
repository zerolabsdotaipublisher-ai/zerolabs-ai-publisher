"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAttachmentType,
  getAttachmentValidationError,
  isCommunityPostType,
  isFilePostType,
  type CommunityAttachmentType,
  type CommunityPostType,
} from "./post-config";

function isMissingFeedSchema(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "42501" || error?.code === "PGRST205" || error?.message?.toLowerCase().includes("schema cache") === true;
}

function logFeedActionError(label: string, error: unknown) {
  const code = typeof error === "object" && error && "code" in error && typeof error.code === "string" ? error.code : null;
  logger.warn(`Feed action failed: ${label}`, {
    category: "error",
    service: "supabase",
    error: {
      name: error instanceof Error ? error.name : "FeedActionError",
      message: code ? `Supabase error ${code}` : "Feed operation failed",
    },
  });
}

function normalizeVisibility(value: FormDataEntryValue | null): "public" | "private" {
  return value === "private" ? "private" : "public";
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type FeedActionResult = { success: true } | { error: string };

function isFileEntry(value: FormDataEntryValue | null): value is File {
  if (!value || typeof value !== "object") return false;
  if (typeof File !== "undefined" && value instanceof File) return true;

  const candidate = value as Partial<File>;
  return typeof candidate.name === "string"
    && typeof candidate.size === "number"
    && typeof candidate.type === "string"
    && typeof candidate.arrayBuffer === "function";
}

function getSafeActionError(error: unknown): string {
  if (isMissingFeedSchema(error as { code?: string; message?: string } | null)) return "Feed posting is temporarily unavailable.";
  return "Unable to create your post. Please try again.";
}

function getSafeAttachmentError(error: unknown): string {
  if (isMissingFeedSchema(error as { code?: string; message?: string } | null)) return "Feed attachments are temporarily unavailable.";
  return "Unable to save the attachment. Please try again.";
}

async function removeStorageObject(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, storagePath: string) {
  try {
    const { error } = await supabase.storage.from("community-attachments").remove([storagePath]);
    if (error) logFeedActionError("remove uploaded attachment", error);
  } catch (error) {
    logFeedActionError("remove uploaded attachment", error);
  }
}

async function cleanUpFailedPost(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  postId: string,
  userId: string,
  storagePath: string | null,
) {
  if (storagePath) await removeStorageObject(supabase, storagePath);

  try {
    const { error } = await supabase
      .from("community_post_attachments")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) logFeedActionError("remove failed attachment metadata", error);
  } catch (error) {
    logFeedActionError("remove failed attachment metadata", error);
  }

  try {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", userId);
    if (error) logFeedActionError("remove failed post", error);
  } catch (error) {
    logFeedActionError("remove failed post", error);
  }
}

async function uploadAttachment(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  storagePath: string,
  file: File,
) {
  const upload = await supabase.storage.from("community-attachments").upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (upload.error) throw upload.error;
}

async function insertAttachmentMetadata(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  postId: string,
  userId: string,
  type: CommunityAttachmentType,
  storagePath: string,
  file: File,
  metadata: Record<string, unknown> = {},
) {
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

function buildStoragePath(userId: string, postId: string, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "attachment";
  return `${userId}/${postId}/${crypto.randomUUID()}-${safeName}`;
}

export async function createCommunityPost(formData: FormData): Promise<FeedActionResult> {
  const user = await requireUser(routes.feed);
  try {
    const title = readText(formData, "title");
    const body = readText(formData, "body");
    const postType = readText(formData, "post_type") || "text";
    const visibility = normalizeVisibility(formData.get("visibility"));

    if (!isCommunityPostType(postType)) return { error: "Select a supported post type." };
    if (!body) return { error: "Post body is required." };

    const attachmentType = getAttachmentType(postType);
    const fileEntry = formData.get("attachment");
    const file = isFileEntry(fileEntry) && fileEntry.size > 0 ? fileEntry : null;
    if (file && !isFilePostType(postType)) return { error: "This post type does not accept a file attachment." };
    if (attachmentType && attachmentType !== "project" && attachmentType !== "code" && !file) return { error: "Select a file before posting." };
    if (file && attachmentType && attachmentType !== "project") {
      const validationError = getAttachmentValidationError(file, attachmentType);
      if (validationError) return { error: validationError };
    }

    const projectUrl = postType === "project" ? readText(formData, "project_url") : "";
    if (postType === "project" && !/^https?:\/\//i.test(projectUrl)) return { error: "Enter a valid project link." };

    const supabase = await getSupabaseServerClient();
    let website: { id: string; site_title: string | null; visibility: string | null; status: string | null } | null = null;
    if (postType === "website") {
      const websiteId = readText(formData, "website_id");
      if (!websiteId) return { error: "Select a website before posting." };
      const { data, error: websiteError } = await supabase
        .from("website_structures")
        .select("id, site_title, visibility, status")
        .eq("id", websiteId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (websiteError) {
        logFeedActionError("verify website", websiteError);
        return { error: "Unable to verify website visibility." };
      }
      website = data;
      if (!website) return { error: "You are not allowed to share this website." };
      if (website.visibility !== "public") return { error: "Make the website public before sharing it to Feed." };
      if (website.status !== "published") return { error: "Publish the website before sharing it to Feed." };
    }

    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, title: title || null, body, visibility })
      .select("id")
      .single();

    if (postError || !post) {
      logFeedActionError("create post", postError);
      return { error: getSafeActionError(postError) };
    }

    let storagePath: string | null = null;
    try {
      if (file && attachmentType) {
        storagePath = buildStoragePath(user.id, post.id, file);
        await uploadAttachment(supabase, storagePath, file);
        await insertAttachmentMetadata(supabase, post.id, user.id, attachmentType, storagePath, file, { post_type: postType });
      }
      if (postType === "project") {
        const { error: projectError } = await supabase.from("community_post_attachments").insert({
          post_id: post.id,
          user_id: user.id,
          attachment_type: "project",
          storage_path: `link:${projectUrl}`,
          public_url: projectUrl,
          metadata: { kind: "project-link" },
        });
        if (projectError) throw projectError;
      }
      if (postType === "website") {
        if (!website) throw new Error("Website ownership could not be verified.");
        const { error: websiteAttachmentError } = await supabase.from("community_post_attachments").insert({
          post_id: post.id,
          user_id: user.id,
          attachment_type: "project",
          storage_path: `website:${website.id}`,
          file_name: website.site_title,
          metadata: { website_id: website.id, kind: "generated-website" },
        });
        if (websiteAttachmentError) throw websiteAttachmentError;
      }
    } catch (attachmentError) {
      logFeedActionError("create attachment", attachmentError);
      await cleanUpFailedPost(supabase, post.id, user.id, storagePath);
      return { error: getSafeAttachmentError(attachmentError) };
    }

    try {
      revalidatePath(routes.feed);
    } catch (error) {
      logFeedActionError("revalidate feed", error);
    }
    return { success: true };
  } catch (error) {
    logFeedActionError("create community post", error);
    return { error: getSafeActionError(error) };
  }
}

export async function shareWebsiteToFeed(structureId: string, title: string) {
  const user = await requireUser(routes.feed);
  const websiteId = structureId.trim();
  if (!websiteId) return { error: "Website id is required." };

  const supabase = await getSupabaseServerClient();
  const { data: website, error: websiteError } = await supabase
    .from("website_structures")
    .select("id, site_title, visibility, status")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (websiteError) {
    logFeedActionError("check website before sharing", websiteError);
    return { error: "Unable to verify website visibility." };
  }
  if (!website) return { error: "You are not allowed to share this website." };
  if (website.visibility !== "public") return { error: "Make the website public before sharing it to Feed." };
  if (website.status !== "published") return { error: "Publish the website before sharing it to Feed." };

  const { data: post, error: postError } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      title: title.trim() || website.site_title || "Generated website",
      body: `Shared website: ${website.site_title || "Untitled website"}`,
      visibility: "public",
    })
    .select("id")
    .single();

  if (postError || !post) {
    logFeedActionError("share website post", postError);
    return { error: "Feed tables are not configured." };
  }

  const { error: attachmentError } = await supabase.from("community_post_attachments").insert({
    post_id: post.id,
    user_id: user.id,
    attachment_type: "project",
    storage_path: `website:${website.id}`,
    file_name: website.site_title,
    metadata: { website_id: website.id, kind: "generated-website" },
  });

  if (attachmentError) {
    await supabase.from("community_posts").delete().eq("id", post.id).eq("user_id", user.id);
    logFeedActionError("share website attachment", attachmentError);
    return { error: "Feed attachments are not configured." };
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

  const { data: attachments } = await supabase
    .from("community_post_attachments")
    .select("storage_path")
    .eq("post_id", postId)
    .eq("user_id", user.id);

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

  const storagePaths = (attachments ?? [])
    .map((attachment) => attachment.storage_path)
    .filter((storagePath): storagePath is string => Boolean(storagePath) && !storagePath.startsWith("link:") && !storagePath.startsWith("website:"));
  if (storagePaths.length > 0) {
    await supabase.storage.from("community-attachments").remove(storagePaths);
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
