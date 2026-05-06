import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { listManagedWebsites } from "@/lib/management";
import { listOwnedContentSchedules } from "@/lib/scheduling";
import type {
  ContentLibraryRawArticleRow,
  ContentLibraryRawBlogRow,
  ContentLibraryRawSeoRow,
  ContentLibraryRawSocialRow,
  ContentLibraryRawWebsitePageRow,
  ContentLibraryStorageSnapshot,
} from "./types";

const MAX_SOURCE_ROWS = 500;

async function listWebsitePageRows(userId: string): Promise<ContentLibraryRawWebsitePageRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_generated_content")
    .select("id, structure_id, content_status, page_slug, content_json, generated_from_input, created_at, updated_at")
    .eq("user_id", userId)
    .eq("content_type", "website")
    .eq("section_key", "__page__")
    .eq("is_archived", false)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw error;
  }

  return (data ?? []) as ContentLibraryRawWebsitePageRow[];
}

async function listBlogRows(userId: string): Promise<ContentLibraryRawBlogRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, structure_id, content_status, title, slug, source_input, generated_at, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw error;
  }

  return (data ?? []) as ContentLibraryRawBlogRow[];
}

async function listArticleRows(userId: string): Promise<ContentLibraryRawArticleRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("article_posts")
    .select("id, structure_id, content_status, title, slug, source_input, generated_at, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw error;
  }

  return (data ?? []) as ContentLibraryRawArticleRow[];
}

async function listSocialRows(userId: string): Promise<ContentLibraryRawSocialRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("id, structure_id, content_status, title, topic, source_input, generated_at, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw error;
  }

  return (data ?? []) as ContentLibraryRawSocialRow[];
}

function extractKeywordArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function listSeoKeywordsByStructure(userId: string): Promise<Map<string, string[]>> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_seo_metadata")
    .select("structure_id, version, metadata_json")
    .eq("user_id", userId)
    .eq("page_slug", "__site__")
    .is("deleted_at", null)
    .order("version", { ascending: false })
    .limit(MAX_SOURCE_ROWS);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ContentLibraryRawSeoRow[];
  const latestByStructure = new Map<string, ContentLibraryRawSeoRow>();
  rows.forEach((row) => {
    if (!latestByStructure.has(row.structure_id)) {
      latestByStructure.set(row.structure_id, row);
    }
  });

  const keywordsByStructure = new Map<string, string[]>();
  latestByStructure.forEach((row, structureId) => {
    const siteMetadata = row.metadata_json as { keywords?: unknown };
    keywordsByStructure.set(structureId, extractKeywordArray(siteMetadata?.keywords));
  });

  return keywordsByStructure;
}

export async function fetchOwnedContentLibrarySnapshot(userId: string): Promise<ContentLibraryStorageSnapshot> {
  const [websitePages, blogs, articles, socialPosts, websites, schedules, seoSiteMetadataByStructureId] =
    await Promise.all([
      listWebsitePageRows(userId),
      listBlogRows(userId),
      listArticleRows(userId),
      listSocialRows(userId),
      listManagedWebsites(userId, { status: "all", includeDeleted: false }),
      listOwnedContentSchedules(userId),
      listSeoKeywordsByStructure(userId),
    ]);

  const websitesByStructureId = new Map(websites.map((website) => [website.id, { id: website.id, title: website.title }]));
  const schedulesByStructureId = new Map(
    schedules.map((schedule) => [schedule.structureId, { status: schedule.status }]),
  );

  return {
    websitePages,
    blogs,
    articles,
    socialPosts,
    seoSiteMetadataByStructureId,
    schedulesByStructureId,
    websitesByStructureId,
  };
}
