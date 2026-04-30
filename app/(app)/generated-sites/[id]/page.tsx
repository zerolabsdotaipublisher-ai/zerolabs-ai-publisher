import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure } from "@/lib/ai/structure/storage";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { Renderer } from "@/components/generated-site/renderer";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { ContentSchedulePanel } from "@/components/scheduling/content-schedule-panel";
import { VersionHistoryPanel } from "@/components/versions/version-history-panel";
import { detectPublicationState } from "@/lib/publish";
import { resolveWebsitePageByPath } from "@/lib/routing";
import { SocialSchedulePanel } from "@/components/social/social-schedule-panel";
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

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string }>;
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

  const seo = await getWebsiteSeoMetadata(id, user.id);
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
  const publication = detectPublicationState(structure);
  const versions = await listWebsiteVersions(id, user.id);
  const [schedule, socialPosts, socialSchedules, socialHistoryResult] = await Promise.all([
    getOwnedContentScheduleByStructureId(id, user.id),
    listSocialPostsByStructureId(id, user.id),
    listOwnedSocialSchedules(user.id, { structureId: id }),
    listOwnedSocialPublishHistoryJobs(user.id, { page: 1, perPage: 20, platform: undefined, status: undefined }),
  ]);
  const [scheduleRuns, socialScheduleDetails] = await Promise.all([
    schedule ? listOwnedContentScheduleRuns(schedule.id, user.id, 10) : Promise.resolve([]),
    Promise.all(
      socialSchedules.map(async (socialSchedule) => ({
        ...socialSchedule,
        runs: await listOwnedSocialScheduleRuns(socialSchedule.id, user.id, 10),
        events: await listOwnedSocialScheduleEvents(socialSchedule.id, user.id, 10),
      })),
    ),
  ]);
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
          <PublishStatusBadge state={publication.state} />
          <span className="generated-site-version">v{structure.version}</span>
        </p>
      </div>
      <ContentSchedulePanel
        structureId={structure.id}
        websiteType={structure.websiteType}
        initialSchedule={schedule}
        initialRuns={scheduleRuns}
      />
      <SocialSchedulePanel
        structureId={structure.id}
        socialPosts={socialPosts}
        initialSchedules={socialScheduleDetails}
        initialHistory={socialHistoryResult.items}
      />
      <VersionHistoryPanel structureId={structure.id} entries={versionEntries} />
      <Renderer structure={structure} pageSlug={resolvedSearchParams?.page || "/"} />
    </div>
  );
}
