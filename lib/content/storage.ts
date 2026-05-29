import "server-only";

import { deleteWebsiteGeneratedContent, getWebsiteGeneratedContent } from "@/lib/ai/content";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { deleteArticleByStructureId, getArticleByStructureId } from "@/lib/article";
import { deleteBlogPostByStructureId, getBlogPostByStructureId } from "@/lib/blog";
import { deleteSocialPostsByStructureId, listSocialPostsByStructureId } from "@/lib/social";
import { getOwnedContentScheduleByStructureId } from "@/lib/scheduling";
import { listWebsiteVersions } from "@/lib/versions";
import type { GeneratedContentBundle, GeneratedContentLifecycleStatus } from "./types";

function deriveBundleStatus(args: {
  structureStatus: string;
  hasPublishedBlog: boolean;
  hasPublishedArticle: boolean;
  hasPublishedSocialPost: boolean;
  hasScheduledContent: boolean;
  hasScheduledSocialPost: boolean;
  hasActiveSchedule: boolean;
  isDeleted: boolean;
}): GeneratedContentLifecycleStatus {
  // TODO(ZLAP-STORY-6-6): remove dual-source deletion check after legacy records
  // are fully backfilled to structure.status='deleted' in a follow-up migration.
  // For now deletion may be represented in either management metadata or status.
  const deleted = args.isDeleted || args.structureStatus === "deleted";
  if (deleted) {
    return "deleted";
  }

  if (args.structureStatus === "archived") {
    return "archived";
  }

  if (
    args.structureStatus === "published" ||
    args.hasPublishedBlog ||
    args.hasPublishedArticle ||
    args.hasPublishedSocialPost
  ) {
    return "published";
  }

  if (
    args.hasScheduledContent ||
    args.hasScheduledSocialPost ||
    args.hasActiveSchedule ||
    args.structureStatus === "scheduled"
  ) {
    return "scheduled";
  }

  if (args.structureStatus === "edited") {
    return "edited";
  }

  if (args.structureStatus === "generated") {
    return "generated";
  }

  return "draft";
}

export async function getOwnedGeneratedContentBundle(
  structureId: string,
  userId: string,
): Promise<GeneratedContentBundle | null> {
  if (!structureId.trim() || !userId.trim()) {
    throw new Error("structureId and userId are required.");
  }

  const structure = await getWebsiteStructure(structureId, userId);
  if (!structure) {
    return null;
  }

  const [generatedContent, seo, blog, article, socialPosts, schedule, versions] = await Promise.all([
    getWebsiteGeneratedContent(structureId, userId),
    getWebsiteSeoMetadata(structureId, userId),
    getBlogPostByStructureId(structureId, userId),
    getArticleByStructureId(structureId, userId),
    listSocialPostsByStructureId(structureId, userId),
    getOwnedContentScheduleByStructureId(structureId, userId),
    listWebsiteVersions(structureId, userId, { limit: 25 }),
  ]);

  const status = deriveBundleStatus({
    structureStatus: structure.status,
    hasPublishedBlog: Boolean(blog?.publishedAt),
    hasPublishedArticle: Boolean(article?.publishedAt),
    hasPublishedSocialPost: socialPosts.some((post) => Boolean(post.publishedAt)),
    hasScheduledContent: Boolean(blog?.scheduledPublishAt || article?.scheduledPublishAt),
    hasScheduledSocialPost: socialPosts.some((post) => Boolean(post.scheduledPublishAt)),
    hasActiveSchedule: schedule?.status === "active" || schedule?.status === "running",
    isDeleted: Boolean(structure.management?.deletedAt),
  });

  return {
    structure,
    generatedContent,
    seo,
    blog,
    article,
    socialPosts,
    schedule,
    versions,
    status,
  };
}

export async function archiveOwnedGeneratedContent(structureId: string, userId: string): Promise<void> {
  if (!structureId.trim() || !userId.trim()) {
    throw new Error("structureId and userId are required.");
  }

  await Promise.all([
    deleteWebsiteGeneratedContent(structureId, userId),
    deleteBlogPostByStructureId(structureId, userId),
    deleteArticleByStructureId(structureId, userId),
    deleteSocialPostsByStructureId(structureId, userId),
  ]);
}
