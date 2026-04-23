import "server-only";

import { deleteWebsiteGeneratedContent, getWebsiteGeneratedContent } from "@/lib/ai/content";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { deleteArticleByStructureId, getArticleByStructureId } from "@/lib/article";
import { deleteBlogPostByStructureId, getBlogPostByStructureId } from "@/lib/blog";
import { getOwnedContentScheduleByStructureId } from "@/lib/scheduling";
import { listWebsiteVersions } from "@/lib/versions";
import type { GeneratedContentBundle, GeneratedContentLifecycleStatus } from "./types";

function deriveBundleStatus(args: {
  structureStatus: string;
  hasPublishedBlog: boolean;
  hasPublishedArticle: boolean;
  hasScheduledContent: boolean;
  hasActiveSchedule: boolean;
  isDeleted: boolean;
}): GeneratedContentLifecycleStatus {
  if (args.isDeleted || args.structureStatus === "deleted") {
    return "deleted";
  }

  if (args.structureStatus === "archived") {
    return "archived";
  }

  if (args.structureStatus === "published" || args.hasPublishedBlog || args.hasPublishedArticle) {
    return "published";
  }

  if (args.hasScheduledContent || args.hasActiveSchedule || args.structureStatus === "scheduled") {
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

  const [generatedContent, seo, blog, article, schedule, versions] = await Promise.all([
    getWebsiteGeneratedContent(structureId, userId),
    getWebsiteSeoMetadata(structureId, userId),
    getBlogPostByStructureId(structureId, userId),
    getArticleByStructureId(structureId, userId),
    getOwnedContentScheduleByStructureId(structureId, userId),
    listWebsiteVersions(structureId, userId, { limit: 25 }),
  ]);

  const status = deriveBundleStatus({
    structureStatus: structure.status,
    hasPublishedBlog: Boolean(blog?.publishedAt),
    hasPublishedArticle: Boolean(article?.publishedAt),
    hasScheduledContent: Boolean(blog?.scheduledPublishAt || article?.scheduledPublishAt),
    hasActiveSchedule: schedule?.status === "active" || schedule?.status === "running",
    isDeleted: Boolean(structure.management?.deletedAt),
  });

  return {
    structure,
    generatedContent,
    seo,
    blog,
    article,
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
  ]);
}
