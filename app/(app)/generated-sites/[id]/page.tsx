import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure } from "@/lib/ai/structure/storage";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { Renderer } from "@/components/generated-site/renderer";

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
  if (!structure) {
    return {};
  }

  const seo = await getWebsiteSeoMetadata(id, user.id);
  const page = structure.pages.find((candidate) => candidate.slug === pageSlug) ?? structure.pages[0];
  const pageSeo = seo?.pages.find((candidate) => candidate.pageSlug === page?.slug);

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

  if (!structure) {
    notFound();
  }

  return (
    <div className="generated-site-container">
      <div className="generated-site-meta">
        <p className="generated-site-info">
          <span>{structure.siteTitle}</span>
          <span className="generated-site-status">{structure.status}</span>
          <span className="generated-site-version">v{structure.version}</span>
        </p>
      </div>
      <Renderer structure={structure} pageSlug={resolvedSearchParams?.page || "/"} />
    </div>
  );
}
