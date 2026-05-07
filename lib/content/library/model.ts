import { routes } from "@/config/routes";
import { filterContentLibraryItems } from "./filters";
import { searchContentLibraryItems } from "./search";
import { CONTENT_LIBRARY_MVP_BOUNDARIES, contentLibraryScenarios } from "./scenarios";
import { fetchOwnedContentLibrarySnapshot } from "./storage";
import type {
  ContentLibraryItem,
  ContentLibraryPage,
  ContentLibraryQuery,
  ContentLibrarySort,
  ContentLibraryStatus,
  ContentLibraryStorageSnapshot,
} from "./types";

function toStatus(value: string | null | undefined): ContentLibraryStatus {
  if (!value) {
    return "unknown";
  }

  if (["draft", "generated", "edited", "scheduled", "published", "archived", "deleted", "failed"].includes(value)) {
    return value as ContentLibraryStatus;
  }

  return "unknown";
}

function formatPageTitle(baseTitle: string | undefined, pageSlug: string): string {
  const safeTitle = baseTitle?.trim() || "Website page";
  if (pageSlug === "/") {
    return `${safeTitle} (Home)`;
  }
  return `${safeTitle} (${pageSlug})`;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getGeneratedInputKeywords(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as { services?: unknown; keywords?: unknown };
  return [...getStringArray(record.services), ...getStringArray(record.keywords)];
}

function getSourceInputKeywords(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as { keywords?: unknown; tags?: unknown };
  return [...getStringArray(record.keywords), ...getStringArray(record.tags)];
}

function dedupeKeywords(values: string[]): string[] {
  return Array.from(new Set(values));
}

function mapWebsitePages(snapshot: ContentLibraryStorageSnapshot): ContentLibraryItem[] {
  return snapshot.websitePages.map((row) => {
    const linkedWebsite = snapshot.websitesByStructureId.get(row.structure_id);
    const seoKeywords = snapshot.seoSiteMetadataByStructureId.get(row.structure_id) ?? [];
    const generatedInputKeywords = getGeneratedInputKeywords(row.generated_from_input);
    const pageMessaging = row.content_json as { pageHeadline?: string };

    return {
      id: `website_page:${row.id}`,
      sourceId: row.id,
      type: "website_page",
      title: formatPageTitle(pageMessaging?.pageHeadline || linkedWebsite?.title, row.page_slug),
      status: toStatus(row.content_status),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pageSlug: row.page_slug,
      linkedWebsite: linkedWebsite && row.structure_id
        ? {
            structureId: row.structure_id,
            title: linkedWebsite.title,
          }
        : undefined,
      keywords: dedupeKeywords([...generatedInputKeywords, ...seoKeywords]),
      hasLinkedSeoMetadata: seoKeywords.length > 0,
      quickActions: {
        viewHref: `${routes.previewSite(row.structure_id)}?page=${encodeURIComponent(row.page_slug)}`,
        editHref: routes.editContent(`website_page:${row.id}`),
        publishScheduleHref: routes.generatedSite(row.structure_id),
        canDelete: true,
        deleteStructureId: row.structure_id,
      },
    };
  });
}

function mapBlogs(snapshot: ContentLibraryStorageSnapshot): ContentLibraryItem[] {
  return snapshot.blogs.map((row) => {
    const linkedWebsite = snapshot.websitesByStructureId.get(row.structure_id);
    const seoKeywords = snapshot.seoSiteMetadataByStructureId.get(row.structure_id) ?? [];

    return {
      id: `blog_post:${row.id}`,
      sourceId: row.id,
      type: "blog_post",
      title: row.title,
      status: toStatus(row.content_status),
      createdAt: row.generated_at,
      updatedAt: row.updated_at,
      linkedWebsite: linkedWebsite
        ? {
            structureId: row.structure_id,
            title: linkedWebsite.title,
          }
        : undefined,
      pageSlug: `/${row.slug}`,
      keywords: dedupeKeywords([...getSourceInputKeywords(row.source_input), ...seoKeywords]),
      hasLinkedSeoMetadata: seoKeywords.length > 0,
      quickActions: {
        viewHref: `${routes.previewSite(row.structure_id)}?page=${encodeURIComponent(`/${row.slug}`)}`,
        editHref: routes.editContent(`blog_post:${row.id}`),
        publishScheduleHref: routes.generatedSite(row.structure_id),
        canDelete: true,
        deleteStructureId: row.structure_id,
      },
    };
  });
}

function mapArticles(snapshot: ContentLibraryStorageSnapshot): ContentLibraryItem[] {
  return snapshot.articles.map((row) => {
    const linkedWebsite = snapshot.websitesByStructureId.get(row.structure_id);
    const seoKeywords = snapshot.seoSiteMetadataByStructureId.get(row.structure_id) ?? [];

    return {
      id: `article:${row.id}`,
      sourceId: row.id,
      type: "article",
      title: row.title,
      status: toStatus(row.content_status),
      createdAt: row.generated_at,
      updatedAt: row.updated_at,
      linkedWebsite: linkedWebsite
        ? {
            structureId: row.structure_id,
            title: linkedWebsite.title,
          }
        : undefined,
      pageSlug: `/${row.slug}`,
      keywords: dedupeKeywords([...getSourceInputKeywords(row.source_input), ...seoKeywords]),
      hasLinkedSeoMetadata: seoKeywords.length > 0,
      quickActions: {
        viewHref: `${routes.previewSite(row.structure_id)}?page=${encodeURIComponent(`/${row.slug}`)}`,
        editHref: routes.editContent(`article:${row.id}`),
        publishScheduleHref: routes.generatedSite(row.structure_id),
        canDelete: true,
        deleteStructureId: row.structure_id,
      },
    };
  });
}

function mapSocialPosts(snapshot: ContentLibraryStorageSnapshot): ContentLibraryItem[] {
  return snapshot.socialPosts.map((row) => {
    const sourceInput = (row.source_input ?? {}) as { campaignGoal?: string };
    // Social posts may be generated from custom prompts without website linkage, so structure_id can be null/empty.
    const structureId = typeof row.structure_id === "string" && row.structure_id.trim()
      ? row.structure_id
      : undefined;
    const linkedWebsite = structureId ? snapshot.websitesByStructureId.get(structureId) : undefined;
    const linkedWebsiteMeta = linkedWebsite && structureId
      ? {
          structureId,
          title: linkedWebsite.title,
        }
      : undefined;

    return {
      id: `social_post:${row.id}`,
      sourceId: row.id,
      type: "social_post",
      title: row.title || row.topic,
      status: toStatus(row.content_status),
      createdAt: row.generated_at,
      updatedAt: row.updated_at,
      linkedWebsite: linkedWebsiteMeta,
      linkedCampaign: sourceInput.campaignGoal,
      keywords: dedupeKeywords(getSourceInputKeywords(row.source_input)),
      hasLinkedSeoMetadata: false,
      quickActions: {
        viewHref: structureId ? routes.generatedSite(structureId) : undefined,
        editHref: routes.editContent(`social_post:${row.id}`),
        publishScheduleHref: structureId ? routes.generatedSite(structureId) : undefined,
        canDelete: false,
      },
    };
  });
}

function withScheduleAwareStatus(
  items: ContentLibraryItem[],
  snapshot: ContentLibraryStorageSnapshot,
): ContentLibraryItem[] {
  return items.map((item) => {
    const structureId = item.linkedWebsite?.structureId;
    if (!structureId || item.status === "published") {
      return item;
    }

    const schedule = snapshot.schedulesByStructureId.get(structureId);
    if (!schedule) {
      return item;
    }

    if (["active", "running"].includes(schedule.status)) {
      return {
        ...item,
        status: "scheduled",
      };
    }

    if (schedule.status === "failed") {
      return {
        ...item,
        status: "failed",
      };
    }

    return item;
  });
}

function sortContentLibraryItems(items: ContentLibraryItem[], sort: ContentLibrarySort): ContentLibraryItem[] {
  const cloned = items.slice();

  if (sort === "created_desc") {
    return cloned.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  if (sort === "title_asc") {
    return cloned.sort((left, right) => left.title.localeCompare(right.title));
  }

  return cloned.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function paginateItems(items: ContentLibraryItem[], page: number, perPage: number): ContentLibraryPage {
  const total = items.length;
  const startIndex = (page - 1) * perPage;
  const pagedItems = items.slice(startIndex, startIndex + perPage);

  return {
    items: pagedItems,
    total,
    page,
    perPage,
    hasMore: startIndex + perPage < total,
    availableWebsites: [],
    scenarios: contentLibraryScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...CONTENT_LIBRARY_MVP_BOUNDARIES],
  };
}

export async function listOwnedContentLibraryPage(
  userId: string,
  query: ContentLibraryQuery,
): Promise<ContentLibraryPage> {
  const snapshot = await fetchOwnedContentLibrarySnapshot(userId);
  const allItems = withScheduleAwareStatus(
    [
      ...mapWebsitePages(snapshot),
      ...mapBlogs(snapshot),
      ...mapArticles(snapshot),
      ...mapSocialPosts(snapshot),
    ],
    snapshot,
  );

  const filtered = filterContentLibraryItems(allItems, query);
  const searched = searchContentLibraryItems(filtered, query.search);
  const sorted = sortContentLibraryItems(searched, query.sort);
  const paged = paginateItems(sorted, query.page, query.perPage);

  paged.availableWebsites = Array.from(snapshot.websitesByStructureId.entries())
    .map(([structureId, website]) => ({ structureId, title: website.title }))
    .sort((left, right) => left.title.localeCompare(right.title));

  return paged;
}
