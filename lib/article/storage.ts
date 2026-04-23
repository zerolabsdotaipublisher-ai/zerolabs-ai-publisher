import "server-only";

import type { ContentLengthPreset, WebsiteContentPackage } from "@/lib/ai/content";
import { storeWebsiteGeneratedContent } from "@/lib/ai/content";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ArticleRow, GeneratedArticle } from "./types";

export interface ArticlePublicationMetadataUpdate {
  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
}

type ArticleContentStatus =
  | "draft"
  | "generated"
  | "edited"
  | "scheduled"
  | "published"
  | "archived"
  | "deleted";

function deriveArticleContentStatus(article: GeneratedArticle): ArticleContentStatus {
  if (article.publishedAt) {
    return "published";
  }
  if (article.scheduledPublishAt) {
    return "scheduled";
  }
  if (article.version > 1) {
    return "edited";
  }
  return "generated";
}

function toRow(
  article: GeneratedArticle,
  userId: string,
  status = deriveArticleContentStatus(article),
): ArticleRow {
  return {
    id: article.id,
    structure_id: article.structureId,
    user_id: userId,
    content_status: status,
    created_by: userId,
    updated_by: userId,
    title: article.title,
    slug: article.slug,
    article_type: article.articleType,
    article_json: article,
    source_input: article.sourceInput,
    version: article.version,
    archived_at: null,
    deleted_at: null,
    generated_at: article.generatedAt,
    updated_at: article.updatedAt,
    scheduled_publish_at: article.scheduledPublishAt ?? null,
    published_at: article.publishedAt ?? null,
  } as ArticleRow;
}

function fromRow(row: ArticleRow): GeneratedArticle {
  return row.article_json as GeneratedArticle;
}

function toContentLengthPreset(article: GeneratedArticle): ContentLengthPreset {
  switch (article.requirements.length) {
    case "short":
      return "concise";
    case "long":
    case "extended":
      return "detailed";
    default:
      return "balanced";
  }
}

function toWebsiteContentPackage(article: GeneratedArticle, userId: string): WebsiteContentPackage {
  return {
    id: `wcontent_${article.structureId}_v${article.version}`,
    structureId: article.structureId,
    userId,
    websiteType: "article",
    tone: article.requirements.tone,
    style: article.requirements.style,
    lengthPreset: toContentLengthPreset(article),
    densityPreset: article.requirements.depth === "expert" ? "high" : "medium",
    pages: [
      {
        pageSlug: "/",
        pageType: "home",
        messaging: {
          pageHeadline: article.siteTitle,
          pageSubheadline: article.subtitle,
          valueProposition: article.callToAction,
        },
        sections: {
          hero: {
            headline: article.siteTitle,
            subheadline: article.subtitle,
            supportingCopy: article.introduction,
            primaryCta: "Read featured article",
            secondaryCta: "Preview article",
          },
          about: {
            headline: "Featured article",
            subheadline: article.title,
            paragraphs: [article.excerpt],
            bullets: article.metadata.tags,
          },
          microcopy: {
            primaryButtonLabel: "Read featured article",
            secondaryButtonLabel: "Preview article",
            shortTagline: article.title,
          },
        },
      },
      {
        pageSlug: `/${article.slug}`,
        pageType: "custom",
        messaging: {
          pageHeadline: article.title,
          pageSubheadline: article.subtitle,
          valueProposition: article.introduction,
        },
        sections: {
          about: {
            headline: article.title,
            subheadline: article.subtitle,
            paragraphs: [article.introduction, article.conclusion],
            bullets: article.metadata.tags,
          },
          faq: {
            headline: "Article outline",
            items: article.sections.map((section) => ({
              question: section.heading,
              answer: [section.summary, ...section.paragraphs].join(" "),
            })),
          },
          microcopy: {
            primaryButtonLabel: article.callToAction,
            helperText: article.scheduledPublishAt ? `Scheduled for ${article.scheduledPublishAt}` : undefined,
            bullets: article.seo.tags,
          },
        },
      },
    ],
    generatedFromInput: {
      websiteType: "article",
      brandName: article.sourceInput.brandName ?? article.siteTitle,
      description: article.sourceInput.summary ?? article.sourceInput.topic,
      targetAudience: article.sourceInput.targetAudience,
      tone: article.sourceInput.tone,
      style: article.sourceInput.style ?? article.requirements.style,
      primaryCta: article.sourceInput.callToAction ?? article.callToAction,
      services: article.sourceInput.keywords,
      constraints: [
        `article_id:${article.id}`,
        `article_structure_id:${article.structureId}`,
        `article_structure_version:${article.version}`,
        `article_type:${article.articleType}`,
        `article_depth:${article.requirements.depth}`,
        `article_length:${article.requirements.length}`,
        ...(article.metadata.versionId ? [`article_version_id:${article.metadata.versionId}`] : []),
      ],
    },
    generatedAt: article.generatedAt,
    updatedAt: article.updatedAt,
    version: article.version,
  };
}

export async function upsertArticle(article: GeneratedArticle, userId: string): Promise<GeneratedArticle> {
  const supabase = getSupabaseServiceClient();
  const status = deriveArticleContentStatus(article);
  const row = toRow(article, userId, status);

  const { error } = await supabase.from("article_posts").upsert(row, { onConflict: "id" });

  if (error) {
    logger.error("Failed to store article", {
      category: "error",
      service: "supabase",
      structureId: article.structureId,
      error: { name: "ArticleStorageError", message: error.message },
    });
    throw error;
  }

  await storeWebsiteGeneratedContent(toWebsiteContentPackage(article, userId), {
    contentType: "article",
    contentStatus: status,
    scheduleState: article.scheduledPublishAt ? "active" : "none",
  });

  return article;
}

export async function getArticleByStructureId(
  structureId: string,
  userId: string,
): Promise<GeneratedArticle | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("article_posts")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;

    logger.error("Failed to load article", {
      category: "error",
      service: "supabase",
      structureId,
      error: { name: "ArticleStorageError", message: error.message },
    });
    throw error;
  }

  return fromRow(data as ArticleRow);
}

export async function deleteArticleByStructureId(
  structureId: string,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("article_posts")
    .update({
      content_status: "deleted",
      archived_at: now,
      deleted_at: now,
      updated_by: userId,
      updated_at: now,
    })
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to delete article", {
      category: "error",
      service: "supabase",
      structureId,
      error: { name: "ArticleStorageError", message: error.message },
    });
    throw error;
  }
}

export async function updateArticlePublicationMetadata(
  structureId: string,
  userId: string,
  updates: ArticlePublicationMetadataUpdate,
): Promise<GeneratedArticle | null> {
  const existing = await getArticleByStructureId(structureId, userId);
  if (!existing) {
    return null;
  }

  const next: GeneratedArticle = {
    ...existing,
    scheduledPublishAt:
      updates.scheduledPublishAt === undefined
        ? existing.scheduledPublishAt
        : updates.scheduledPublishAt ?? undefined,
    publishedAt:
      updates.publishedAt === undefined
        ? existing.publishedAt
        : updates.publishedAt ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  return upsertArticle(next, userId);
}
