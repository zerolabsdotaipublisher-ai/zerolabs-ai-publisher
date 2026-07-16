import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure } from "@/lib/ai/structure/storage";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { Renderer } from "@/components/generated-site/renderer";
import { PublishStatusSummary } from "@/components/publish/publish-status-summary";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { ManualOverrideStatus } from "@/components/publish/manual-override-status";
import { ContentSchedulePanel } from "@/components/scheduling/content-schedule-panel";
import { VersionHistoryPanel } from "@/components/versions/version-history-panel";
import { buildPublishingStatusFromStructure } from "@/lib/publish/status";
import { resolveWebsitePageByPath } from "@/lib/routing";
import { SocialSchedulePanel } from "@/components/social/social-schedule-panel";
import { listSocialAccountProviders } from "@/lib/social/accounts";
import { listSocialAccountConnections } from "@/lib/social/accounts/workflow";
import { listOwnedSocialPublishHistoryJobs } from "@/lib/social/history";
import { listSocialPostsByStructureId } from "@/lib/social";
import {
  listOwnedSocialScheduleEvents,
  listOwnedSocialScheduleRuns,
  listOwnedSocialSchedules,
} from "@/lib/social/scheduling";
import {
  getOwnedContentScheduleByStructureId,
  listOwnedContentScheduleRuns,
} from "@/lib/scheduling";
import { summarizeWebsiteVersionComparison } from "@/lib/versions/compare";
import { listWebsiteVersions } from "@/lib/versions/storage";
import { logger } from "@/lib/observability";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
}

function describeOptionalDataError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}

async function loadOptionalGeneratedSiteData<T>(args: {
  area: string;
  structureId: string;
  userId: string;
  fallback: T;
  load: () => Promise<T>;
}): Promise<{ value: T; issue?: string }> {
  try {
    return {
      value: await args.load(),
    };
  } catch (error) {
    logger.warn("Generated site optional data unavailable", {
      category: "error",
      service: "generated-site",
      structureId: args.structureId,
      userId: args.userId,
      area: args.area,
      error: {
        name: "GeneratedSiteOptionalDataWarning",
        message: describeOptionalDataError(error),
      },
    });

    return {
      value: args.fallback,
      issue: args.area,
    };
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageSlug = resolvedSearchParams?.page || "/";
  const user = await getServerUser();

  if (!user) {
    return {};
  }

  const structure = await getWebsiteStructure(id, user.id);
  if (!structure || structure.management?.deletedAt || !structure.pages.length) {
    return {};
  }

  const seoResult = await loadOptionalGeneratedSiteData({
    area: "seo metadata",
    structureId: id,
    userId: user.id,
    fallback: null,
    load: () => getWebsiteSeoMetadata(id, user.id),
  });
  const seo = seoResult.value;
  const page = resolveWebsitePageByPath(structure, pageSlug).page ?? structure.pages[0];
  const pageSeo = page
    ? seo?.pages.find((candidate) => candidate.pageSlug === page.slug)
    : undefined;

  const title = pageSeo?.title || page?.seo.title || structure.seo.title;
  const description = pageSeo?.description || page?.seo.description || structure.seo.description;
  const keywords = pageSeo?.keywords || page?.seo.keywords || structure.seo.keywords;
  const canonical = pageSeo?.canonicalUrl || page?.seo.canonicalUrl;
  const openGraph = pageSeo?.openGraph || page?.seo.openGraph;

  return {
    title,
    description,
    keywords,
    alternates: canonical ? { canonical } : undefined,
    openGraph: openGraph
      ? {
          title: openGraph.title,
          description: openGraph.description,
          url: openGraph.url,
          type: openGraph.type,
          images: openGraph.image ? [{ url: openGraph.image }] : undefined,
        }
      : undefined,
  };
}

/**
 * Render a generated website structure by its ID.
 *
 * Protected by the (app) layout — authentication is already enforced.
 * Fetches the structure from Supabase, scoped to the authenticated user.
 * Returns 404 when the structure does not exist or belongs to another user.
 */
export default async function GeneratedSitePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await getServerUser();

  if (!user) {
    notFound();
  }

  const structure = await getWebsiteStructure(id, user.id);

  if (!structure || structure.management?.deletedAt) {
    notFound();
  }
  const publication = buildPublishingStatusFromStructure(structure);
  const [
    versionsResult,
    scheduleResult,
    socialPostsResult,
    socialSchedulesResult,
    socialHistoryResult,
    socialAccountsResult,
  ] = await Promise.all([
    loadOptionalGeneratedSiteData({
      area: "version history",
      structureId: id,
      userId: user.id,
      fallback: [],
      load: () => listWebsiteVersions(id, user.id),
    }),
    loadOptionalGeneratedSiteData({
      area: "content scheduling",
      structureId: id,
      userId: user.id,
      fallback: null,
      load: () => getOwnedContentScheduleByStructureId(id, user.id),
    }),
    loadOptionalGeneratedSiteData({
      area: "social posts",
      structureId: id,
      userId: user.id,
      fallback: [],
      load: () => listSocialPostsByStructureId(id, user.id),
    }),
    loadOptionalGeneratedSiteData({
      area: "social schedules",
      structureId: id,
      userId: user.id,
      fallback: [],
      load: () => listOwnedSocialSchedules(user.id, { structureId: id }),
    }),
    loadOptionalGeneratedSiteData({
      area: "social publish history",
      structureId: id,
      userId: user.id,
      fallback: { items: [], page: 1, perPage: 20, total: 0 },
      load: () =>
        listOwnedSocialPublishHistoryJobs(user.id, {
          page: 1,
          perPage: 20,
          platform: undefined,
          status: undefined,
        }),
    }),
    loadOptionalGeneratedSiteData({
      area: "social account connections",
      structureId: id,
      userId: user.id,
      fallback: [],
      load: () => listSocialAccountConnections(user.id),
    }),
  ]);
  const socialAccountProviders = listSocialAccountProviders();
  const schedule = scheduleResult.value;
  const socialSchedules = socialSchedulesResult.value;
  const scheduleRunsResult = schedule
    ? await loadOptionalGeneratedSiteData({
        area: "content schedule activity",
        structureId: id,
        userId: user.id,
        fallback: [],
        load: () => listOwnedContentScheduleRuns(schedule.id, user.id, 10),
      })
    : { value: [] as Awaited<ReturnType<typeof listOwnedContentScheduleRuns>>, issue: undefined };
  const socialScheduleResults = await Promise.all(
    socialSchedules.map(async (socialSchedule) => {
      try {
        const [runs, events] = await Promise.all([
          listOwnedSocialScheduleRuns(socialSchedule.id, user.id, 10),
          listOwnedSocialScheduleEvents(socialSchedule.id, user.id, 10),
        ]);

        return {
          detail: {
            ...socialSchedule,
            runs,
            events,
          },
          issue: false,
        };
      } catch (error) {
        logger.warn("Generated site social schedule activity unavailable", {
          category: "error",
          service: "generated-site",
          structureId: id,
          userId: user.id,
          scheduleId: socialSchedule.id,
          error: {
            name: "GeneratedSiteSocialScheduleActivityWarning",
            message: describeOptionalDataError(error),
          },
        });

        return {
          detail: {
            ...socialSchedule,
            runs: [],
            events: [],
          },
          issue: true,
        };
      }
    }),
  );
  const socialScheduleDetails = socialScheduleResults.map((result) => result.detail);
  const socialScheduleActivityIssue = socialScheduleResults.some((result) => result.issue);
  const versions = versionsResult.value;
  const socialPosts = socialPostsResult.value;
  const socialHistoryItems = socialHistoryResult.value.items;
  const socialAccounts = socialAccountsResult.value;
  const optionalDataIssues = Array.from(
    new Set(
      [
        versionsResult.issue,
        scheduleResult.issue,
        scheduleRunsResult.issue,
        socialPostsResult.issue,
        socialSchedulesResult.issue,
        socialHistoryResult.issue,
        socialAccountsResult.issue,
        socialScheduleActivityIssue ? "social schedule activity" : undefined,
      ].filter((issue): issue is string => Boolean(issue)),
    ),
  );
  const versionEntries = versions.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    label: version.label,
    status: version.status,
    source: version.source,
    structureVersion: version.structureVersion,
    isLive: version.isLive,
    isCurrentDraft: version.isCurrentDraft,
    restoredFromVersionId: version.restoredFromVersionId,
    createdAt: version.createdAt,
    deployment: version.deployment,
    comparison: summarizeWebsiteVersionComparison(structure, version),
  }));

  return (
    <div className="generated-site-container">
      <div className="generated-site-meta">
        <p className="generated-site-info">
          <span>{structure.siteTitle}</span>
          <span className="generated-site-status">{structure.status}</span>
          <PublishStatusBadge state={publication.uiState} />
          <span className="generated-site-version">v{structure.version}</span>
        </p>
        <PublishStatusSummary status={publication} compact />
        <ManualOverrideStatus status={publication} />
      </div>
      {optionalDataIssues.length > 0 ? (
        <section className="wizard-step-panel" aria-live="polite">
          <p>
            Some management panels are temporarily unavailable: {optionalDataIssues.join(", ")}.
            The website preview is still available below.
          </p>
        </section>
      ) : null}
      <ContentSchedulePanel
        structureId={structure.id}
        websiteType={structure.websiteType}
        initialSchedule={schedule}
        initialRuns={scheduleRunsResult.value}
      />
      <SocialSchedulePanel
        structureId={structure.id}
        socialPosts={socialPosts}
        initialSchedules={socialScheduleDetails}
        initialHistory={socialHistoryItems}
        initialAccounts={socialAccounts}
        initialAccountProviders={socialAccountProviders}
      />
      <VersionHistoryPanel structureId={structure.id} entries={versionEntries} />
      <Renderer structure={structure} pageSlug={resolvedSearchParams?.page || "/"} />
    </div>
  );
}
