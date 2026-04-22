import { type NextRequest, NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { getArticleByStructureId, type ArticlePreviewResponse } from "@/lib/article";
import { createPreviewModel } from "@/lib/preview/model";
import { PREVIEW_QUERY_KEYS } from "@/lib/preview/state";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import { getServerUser } from "@/lib/supabase/server";

async function buildPreviewResponse(args: {
  userId: string;
  structureId: string;
  pageSlug?: string;
  deviceMode?: string;
}): Promise<NextResponse> {
  if (!args.structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const [structure, article] = await Promise.all([
    getOwnedPreviewStructure(args.structureId, args.userId),
    getArticleByStructureId(args.structureId, args.userId),
  ]);

  if (!structure || !article) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  const model = createPreviewModel({
    structure,
    pageSlug: args.pageSlug ?? `/${article.slug}`,
    deviceMode: args.deviceMode,
    accessLevel: "owner",
  });

  const response: ArticlePreviewResponse = {
    article,
    previewPath: routes.previewSite(args.structureId),
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
        href: `${routes.previewSite(args.structureId)}?page=${encodeURIComponent(page.slug)}`,
        active: page.slug === model.currentPageSlug,
      })),
    },
  };

  return NextResponse.json(response);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId");
  const pageSlug = request.nextUrl.searchParams.get("pageSlug") ?? undefined;
  const deviceMode = request.nextUrl.searchParams.get(PREVIEW_QUERY_KEYS.device) ?? undefined;

  if (!structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return buildPreviewResponse({
    userId: user.id,
    structureId,
    pageSlug,
    deviceMode,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { structureId?: string; pageSlug?: string; deviceMode?: string };
  try {
    body = (await request.json()) as { structureId?: string; pageSlug?: string; deviceMode?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return buildPreviewResponse({
    userId: user.id,
    structureId: body.structureId,
    pageSlug: body.pageSlug,
    deviceMode: body.deviceMode,
  });
}
