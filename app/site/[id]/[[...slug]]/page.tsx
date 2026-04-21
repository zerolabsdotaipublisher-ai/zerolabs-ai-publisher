import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { Renderer } from "@/components/generated-site/renderer";
import { getWebsiteStructureById } from "@/lib/ai/structure/storage";
import { detectPublicationState } from "@/lib/publish";
import { resolveWebsitePageByPath } from "@/lib/routing";

interface LiveSitePageProps {
  params: Promise<{ id: string; slug?: string[] }>;
}

function paramsToPath(slug?: string[]): string {
  if (!slug || slug.length === 0) {
    return "/";
  }

  return `/${slug.join("/")}`;
}

function liveRoutePath(structureId: string, pagePath: string): string {
  const base = routes.liveSite(structureId);
  if (pagePath === "/") {
    return base;
  }

  return `${base}${pagePath}`;
}

export async function generateMetadata({ params }: LiveSitePageProps): Promise<Metadata> {
  const { id, slug } = await params;
  const structure = await getWebsiteStructureById(id);

  if (!structure || structure.management?.deletedAt) {
    return {};
  }

  const publication = detectPublicationState(structure);
  if (publication.state !== "published") {
    return {};
  }

  const pagePath = paramsToPath(slug);
  const resolved = resolveWebsitePageByPath(structure, pagePath);
  const page = resolved.page;

  if (!page) {
    return {};
  }

  return {
    title: page.seo.title || structure.seo.title,
    description: page.seo.description || structure.seo.description,
    keywords: page.seo.keywords?.length ? page.seo.keywords : structure.seo.keywords,
    alternates: page.seo.canonicalUrl ? { canonical: page.seo.canonicalUrl } : undefined,
  };
}

export default async function LiveSitePage({ params }: LiveSitePageProps) {
  const { id, slug } = await params;
  const structure = await getWebsiteStructureById(id);

  if (!structure || structure.management?.deletedAt) {
    notFound();
  }

  const publication = detectPublicationState(structure);
  if (publication.state !== "published") {
    notFound();
  }

  const pagePath = paramsToPath(slug);
  const resolved = resolveWebsitePageByPath(structure, pagePath);

  if (resolved.redirectTo) {
    redirect(liveRoutePath(id, resolved.redirectTo));
  }

  const page = resolved.page;
  if (!page || page.visible === false) {
    notFound();
  }

  return <Renderer structure={structure} pageSlug={page.slug} strictRoute />;
}
