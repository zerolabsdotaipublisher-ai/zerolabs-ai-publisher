import { type NextRequest, NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { getBlogPostByStructureId, type BlogPreviewResponse } from "@/lib/blog";
import { createPreviewModel } from "@/lib/preview/model";
import { PREVIEW_QUERY_KEYS } from "@/lib/preview/state";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId");
  const pageSlug = request.nextUrl.searchParams.get("pageSlug");
  const deviceMode = request.nextUrl.searchParams.get(PREVIEW_QUERY_KEYS.device) ?? undefined;

  if (!structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const [structure, blog] = await Promise.all([
    getOwnedPreviewStructure(structureId, user.id),
    getBlogPostByStructureId(structureId, user.id),
  ]);

  if (!structure || !blog) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  const model = createPreviewModel({
    structure,
    pageSlug: pageSlug ?? `/${blog.slug}`,
    deviceMode,
    accessLevel: "owner",
  });

  const response: BlogPreviewResponse = {
    blog,
    previewPath: routes.previewSite(structureId),
    pageSlug: model.currentPageSlug,
    model: {
      id: model.id,
      currentPageSlug: model.currentPageSlug,
      currentDeviceMode: model.currentDeviceMode,
      routePath: model.routePath,
      previewPath: model.previewPath,
      generatedSitePath: model.generatedSitePath,
      pages: model.pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        href: `${routes.previewSite(structureId)}?page=${encodeURIComponent(page.slug)}`,
        active: page.slug === model.currentPageSlug,
      })),
    },
  };

  return NextResponse.json(response);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const structureId = request.nextUrl.searchParams.get("structureId");
  const pageSlug = request.nextUrl.searchParams.get("pageSlug");
  const nextUrl = new URL(request.url);
  if (structureId) nextUrl.searchParams.set("structureId", structureId);
  if (pageSlug) nextUrl.searchParams.set("pageSlug", pageSlug);
  return GET(new NextRequest(nextUrl));
}
