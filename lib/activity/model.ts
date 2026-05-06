import { routes } from "@/config/routes";
import { filterPublishingActivityItems } from "./filters";
import { PUBLISHING_ACTIVITY_MVP_BOUNDARIES, publishingActivityScenarios } from "./scenarios";
import { fetchPublishingActivitySnapshot } from "./storage";
import { buildPublishingActivityTimeline } from "./timeline";
import type {
  PublishingActivityItem,
  PublishingActivityOverview,
  PublishingActivityQuery,
  PublishingActivityStatus,
  PublishingActivityStorageSnapshot,
} from "./types";

function toIsoNow(): string {
  return new Date().toISOString();
}

function normalizeSocialHistoryStatus(status: string): PublishingActivityStatus {
  if (status === "published") return "published";
  if (status === "failed") return "failed";
  if (status === "publishing" || status === "queued" || status === "requested") return "publishing";
  if (status === "retry") return "retry_pending";
  if (status === "canceled") return "canceled";
  return "publishing";
}

function resolveStructureQuickActions(structureId: string | undefined): PublishingActivityItem["quickActions"] {
  if (!structureId) {
    return [];
  }

  return [
    {
      id: `open_content_${structureId}`,
      label: "Open content",
      kind: "link",
      href: routes.generatedSite(structureId),
    },
    {
      id: `edit_${structureId}`,
      label: "Edit",
      kind: "link",
      href: routes.editorSite(structureId),
    },
    {
      id: `preview_${structureId}`,
      label: "Preview",
      kind: "link",
      href: routes.previewSite(structureId),
    },
  ];
}

function toWebsiteItems(snapshot: PublishingActivityStorageSnapshot): PublishingActivityItem[] {
  const published = snapshot.websites
    .filter((website) => Boolean(website.lastPublishedAt))
    .map((website) => ({
      id: `website_published_${website.id}_${website.lastPublishedAt}`,
      source: "website" as const,
      title: website.title,
      contentType: "website" as const,
      platform: "website" as const,
      status: "published" as const,
      eventType: "website_published" as const,
      occurredAt: website.lastPublishedAt as string,
      createdAt: website.generatedAt,
      updatedAt: website.lastUpdatedAt,
      structureId: website.id,
      quickActions: resolveStructureQuickActions(website.id),
    }));

  const failed = snapshot.websites
    .filter((website) => website.status === "failed")
    .map((website) => ({
      id: `website_failed_${website.id}_${website.lastUpdatedAt}`,
      source: "website" as const,
      title: website.title,
      contentType: "website" as const,
      platform: "website" as const,
      status: "failed" as const,
      eventType: "website_publish_failed" as const,
      occurredAt: website.lastUpdatedAt,
      createdAt: website.generatedAt,
      updatedAt: website.lastUpdatedAt,
      structureId: website.id,
      quickActions: resolveStructureQuickActions(website.id),
    }));

  return [...published, ...failed];
}

function toGeneratedContentItems(snapshot: PublishingActivityStorageSnapshot): PublishingActivityItem[] {
  return snapshot.generatedContentRows
    .map((row): PublishingActivityItem | null => {
      const scheduled = row.content_status === "scheduled" || row.schedule_state === "active" || row.schedule_state === "running";
      const published = row.content_status === "published";

      if (!scheduled && !published) {
        return null;
      }

      const titlePrefix = row.content_type === "website" ? "Website page" : row.content_type === "blog" ? "Blog post" : "Article";

      return {
        id: `content_${row.id}_${row.updated_at}`,
        source: "generated_content",
        title: `${titlePrefix} ${row.page_slug === "/" ? "(home)" : row.page_slug}`,
        contentType: row.content_type === "website" ? "website_page" : row.content_type,
        platform: "website",
        status: published ? "published" : "scheduled",
        eventType: published ? "content_published" : "content_scheduled",
        occurredAt: row.updated_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        structureId: row.structure_id,
        quickActions: resolveStructureQuickActions(row.structure_id),
      };
    })
    .filter((item): item is PublishingActivityItem => Boolean(item));
}

function toContentScheduleItems(snapshot: PublishingActivityStorageSnapshot): PublishingActivityItem[] {
  return snapshot.contentSchedules
    .filter((schedule) => schedule.status === "active" || schedule.status === "running" || schedule.status === "failed" || schedule.status === "cancelled")
    .map((schedule) => ({
      id: `content_schedule_${schedule.id}_${schedule.updatedAt}`,
      source: "content_schedule" as const,
      title: schedule.title,
      contentType: schedule.targetContentType,
      platform: "website" as const,
      status:
        schedule.status === "failed"
          ? "failed"
          : schedule.status === "cancelled"
            ? "canceled"
            : "scheduled",
      eventType:
        schedule.status === "failed"
          ? "content_schedule_failed"
          : "content_scheduled",
      occurredAt: schedule.nextRunAt ?? schedule.updatedAt,
      scheduledFor: schedule.nextRunAt,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      structureId: schedule.structureId,
      scheduleId: schedule.id,
      quickActions: [
        ...resolveStructureQuickActions(schedule.structureId),
        ...(schedule.status === "failed"
          ? [
              {
                id: `content_schedule_retry_${schedule.id}`,
                label: "Retry",
                kind: "api" as const,
                method: "POST" as const,
                apiPath: `/api/schedules/${schedule.id}/run`,
              },
            ]
          : []),
      ],
    }));
}

function toSocialScheduleItems(snapshot: PublishingActivityStorageSnapshot): PublishingActivityItem[] {
  const postMap = new Map(snapshot.socialPosts.map((post) => [post.id, post]));

  return snapshot.socialSchedules
    .filter((schedule) => ["scheduled", "queued", "publishing", "failed", "retry_pending", "canceled"].includes(schedule.status))
    .map((schedule): PublishingActivityItem | null => {
      const post = postMap.get(schedule.socialPostId);
      const title = post?.title || schedule.title;
      const platform = schedule.targets.find((target) => target.enabled)?.platform ?? schedule.targets[0]?.platform;
      if (!platform) {
        return null;
      }

      const status: PublishingActivityStatus =
        schedule.status === "failed"
          ? "failed"
          : schedule.status === "retry_pending"
            ? "retry_pending"
            : schedule.status === "canceled"
              ? "canceled"
              : schedule.status === "publishing" || schedule.status === "queued"
                ? "publishing"
                : "scheduled";

      const eventType =
        status === "failed"
          ? "social_failed"
          : status === "retry_pending"
            ? "social_retry_pending"
            : status === "canceled"
              ? "social_canceled"
              : status === "publishing"
                ? "social_publishing"
                : "social_scheduled";

      return {
        id: `social_schedule_${schedule.id}_${schedule.updatedAt}`,
        source: "social_schedule" as const,
        title,
        contentType: "social_post" as const,
        platform,
        status,
        eventType,
        occurredAt: schedule.scheduledFor ?? schedule.updatedAt,
        scheduledFor: schedule.scheduledFor,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        structureId: schedule.structureId,
        socialPostId: schedule.socialPostId,
        scheduleId: schedule.id,
        quickActions: [
          ...resolveStructureQuickActions(schedule.structureId),
          {
            id: `social_schedule_run_${schedule.id}`,
            label: "Retry",
            kind: "api",
            method: "POST",
            apiPath: `/api/social/schedules/${schedule.id}/run`,
          },
        ],
      } satisfies PublishingActivityItem;
    })
    .filter((item): item is PublishingActivityItem => Boolean(item));
}

function toSocialHistoryItems(snapshot: PublishingActivityStorageSnapshot): PublishingActivityItem[] {
  const accountMap = new Map(
    snapshot.socialAccounts.map((account) => [
      `${account.platform}:${account.platformAccountId}`,
      account.username || account.instagramUsername || account.displayName || account.platformAccountId,
    ]),
  );

  return snapshot.socialHistory.map((history) => {
    const status = normalizeSocialHistoryStatus(history.status);
    const metadataTitle = history.contentSnapshot.metadata.title;
    const title =
      typeof metadataTitle === "string" && metadataTitle.trim()
        ? metadataTitle
        : history.contentSnapshot.caption.slice(0, 80) || `${history.platform} publish`;
    const occurredAt =
      history.completedAt || history.startedAt || history.retryAt || history.scheduledAt || history.updatedAt || history.createdAt;
    const accountLookupKey = `${history.platform}:${history.accountReference.platformAccountId}`;
    const account =
      history.accountReference.platformUsername ||
      history.accountReference.platformAccountId ||
      accountMap.get(accountLookupKey);

    return {
      id: `social_history_${history.id}_${history.updatedAt}`,
      source: "social_history" as const,
      title,
      contentType: "social_post" as const,
      platform: history.platform,
      account,
      status,
      eventType:
        status === "published"
          ? "social_published"
          : status === "failed"
            ? "social_failed"
            : status === "retry_pending"
              ? "social_retry_pending"
              : status === "canceled"
                ? "social_canceled"
                : "social_publishing",
      occurredAt,
      scheduledFor: history.scheduledAt,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
      structureId: history.structureId,
      socialPostId: history.socialPostId,
      quickActions: [
        ...resolveStructureQuickActions(history.structureId),
        ...(status === "failed" || status === "retry_pending"
          ? [
              {
                id: `social_history_retry_${history.id}`,
                label: "Retry",
                kind: "api" as const,
                method: "POST" as const,
                apiPath: `/api/social/history/${history.id}/retry`,
              },
            ]
          : []),
      ],
    } satisfies PublishingActivityItem;
  });
}

function buildSegments(items: PublishingActivityItem[]): Pick<PublishingActivityOverview, "recent" | "upcoming" | "attention"> {
  const now = toIsoNow();

  const upcoming = items
    .filter((item) => item.status === "scheduled" && (item.scheduledFor ?? item.occurredAt) > now)
    .sort((left, right) => (left.scheduledFor ?? left.occurredAt).localeCompare(right.scheduledFor ?? right.occurredAt));

  const attention = items
    .filter((item) => item.status === "failed" || item.status === "retry_pending")
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  const recent = items
    .filter((item) => item.occurredAt <= now)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  return {
    recent,
    upcoming,
    attention,
  };
}

function applySegment(items: PublishingActivityItem[], query: PublishingActivityQuery): PublishingActivityItem[] {
  if (query.segment === "all") {
    return items;
  }

  const now = toIsoNow();
  if (query.segment === "upcoming") {
    return items.filter((item) => item.status === "scheduled" && (item.scheduledFor ?? item.occurredAt) > now);
  }

  if (query.segment === "attention") {
    return items.filter((item) => item.status === "failed" || item.status === "retry_pending");
  }

  return items.filter((item) => item.occurredAt <= now);
}

export async function getPublishingActivityOverview(
  userId: string,
  query: PublishingActivityQuery,
): Promise<PublishingActivityOverview> {
  const snapshot = await fetchPublishingActivitySnapshot(userId);

  const aggregated = [
    ...toWebsiteItems(snapshot),
    ...toGeneratedContentItems(snapshot),
    ...toContentScheduleItems(snapshot),
    ...toSocialScheduleItems(snapshot),
    ...toSocialHistoryItems(snapshot),
  ]
    .filter((item) => Boolean(item.occurredAt))
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  const filtered = filterPublishingActivityItems(aggregated, query);
  const segmented = applySegment(filtered, query);
  const limited = segmented.slice(0, query.limit);
  const sections = buildSegments(limited);

  return {
    generatedAt: toIsoNow(),
    query,
    items: limited,
    recent: sections.recent,
    upcoming: sections.upcoming,
    attention: sections.attention,
    timeline: buildPublishingActivityTimeline(limited),
    scenarios: publishingActivityScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...PUBLISHING_ACTIVITY_MVP_BOUNDARIES],
  };
}
