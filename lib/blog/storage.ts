import "server-only";

import type { ContentLengthPreset, WebsiteContentPackage } from "@/lib/ai/content";
import { storeWebsiteGeneratedContent } from "@/lib/ai/content";
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
    scheduled_publish_at: blog.scheduledPublishAt ?? null,
    published_at: blog.publishedAt ?? null,
  } as BlogPostRow;
}

function fromRow(row: BlogPostRow): GeneratedBlogPost {
  return row.blog_json as GeneratedBlogPost;
}

function toContentLengthPreset(blog: GeneratedBlogPost): ContentLengthPreset {
  switch (blog.requirements.length) {
    case "short":
      return "concise";
    case "long":
      return "detailed";
    default:
      return "balanced";
  }
}

function toWebsiteContentPackage(
  blog: GeneratedBlogPost,
  userId: string,
): WebsiteContentPackage {
  return {
    id: `wcontent_${blog.structureId}_v${blog.version}`,
    structureId: blog.structureId,
    userId,
    websiteType: "blog",
    tone: blog.requirements.tone,
    style: blog.requirements.style,
    lengthPreset: toContentLengthPreset(blog),
    densityPreset: "medium",
    pages: [
      {
        pageSlug: "/",
        pageType: "home",
        messaging: {
          pageHeadline: blog.siteTitle,
          pageSubheadline: blog.excerpt,
          valueProposition: blog.callToAction,
        },
        sections: {
          hero: {
            headline: blog.siteTitle,
            subheadline: blog.excerpt,
            supportingCopy: blog.introduction,
            primaryCta: "Read latest post",
            secondaryCta: "Preview article",
          },
          about: {
            headline: "Latest article",
            subheadline: blog.title,
            paragraphs: [blog.excerpt],
            bullets: blog.metadata.tags,
          },
          microcopy: {
            primaryButtonLabel: "Read latest post",
            secondaryButtonLabel: "Preview article",
            shortTagline: blog.title,
          },
        },
      },
      {
        pageSlug: `/${blog.slug}`,
        pageType: "custom",
        messaging: {
          pageHeadline: blog.title,
          pageSubheadline: blog.excerpt,
          valueProposition: blog.introduction,
        },
        sections: {
          about: {
            headline: blog.title,
            subheadline: blog.excerpt,
            paragraphs: [blog.introduction, blog.conclusion],
            bullets: blog.metadata.tags,
          },
          faq: {
            headline: "Article outline",
            items: blog.sections.map((section) => ({
              question: section.heading,
              answer: [section.summary, ...section.paragraphs].join(" "),
            })),
          },
          microcopy: {
            primaryButtonLabel: blog.callToAction,
            helperText: blog.scheduledPublishAt
              ? `Scheduled for ${blog.scheduledPublishAt}`
              : undefined,
            bullets: blog.seo.tags,
          },
        },
      },
    ],
    generatedFromInput: {
      websiteType: "blog",
      brandName: blog.sourceInput.brandName ?? blog.siteTitle,
      description: blog.sourceInput.summary ?? blog.sourceInput.topic,
      targetAudience: blog.sourceInput.targetAudience,
      tone: blog.sourceInput.tone,
      style: blog.sourceInput.style ?? blog.requirements.style,
      primaryCta: blog.sourceInput.callToAction ?? blog.callToAction,
      services: blog.sourceInput.keywords,
      constraints: [
        `blog_post_id:${blog.id}`,
        `blog_structure_id:${blog.structureId}`,
        `blog_structure_version:${blog.version}`,
        ...(blog.metadata.versionId ? [`blog_version_id:${blog.metadata.versionId}`] : []),
        ...(blog.scheduledPublishAt
          ? [`blog_scheduled_publish_at:${blog.scheduledPublishAt}`]
          : []),
      ],
    },
    generatedAt: blog.generatedAt,
    updatedAt: blog.updatedAt,
    version: blog.version,
  };
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

  await storeWebsiteGeneratedContent(toWebsiteContentPackage(blog, userId));

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
