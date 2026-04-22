import { type NextRequest, NextResponse } from "next/server";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { getArticleByStructureId } from "@/lib/article";
import { getBlogPostByStructureId } from "@/lib/blog";
import { buildSeoPreviewPayload } from "@/lib/seo";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import { getServerUser } from "@/lib/supabase/server";

async function previewResponse(args: {
  structureId: string;
  userId: string;
  contentType?: "website" | "blog" | "article";
}): Promise<NextResponse> {
  const structure = await getOwnedPreviewStructure(args.structureId, args.userId);
  if (!structure) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  const contentType = args.contentType ?? (structure.websiteType === "blog" ? "blog" : structure.websiteType === "article" ? "article" : "website");
  const storedSeo = await getWebsiteSeoMetadata(args.structureId, args.userId).catch(() => null);

  if (contentType === "blog") {
    const blog = await getBlogPostByStructureId(args.structureId, args.userId);
    if (!blog) {
      return NextResponse.json({ error: "Blog preview not found" }, { status: 404 });
    }

    return NextResponse.json({
      blog,
      preview: buildSeoPreviewPayload({
        structure,
        contentType,
        site: storedSeo?.site ?? null,
        pages: storedSeo?.pages,
      }),
    });
  }

  if (contentType === "article") {
    const article = await getArticleByStructureId(args.structureId, args.userId);
    if (!article) {
      return NextResponse.json({ error: "Article preview not found" }, { status: 404 });
    }

    return NextResponse.json({
      article,
      preview: buildSeoPreviewPayload({
        structure,
        contentType,
        site: storedSeo?.site ?? null,
        pages: storedSeo?.pages,
      }),
    });
  }

  return NextResponse.json({
    preview: buildSeoPreviewPayload({
      structure,
      contentType,
      site: storedSeo?.site ?? null,
      pages: storedSeo?.pages,
    }),
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId");
  const contentType = request.nextUrl.searchParams.get("contentType") as "website" | "blog" | "article" | null;
  if (!structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return previewResponse({ structureId, userId: user.id, contentType: contentType ?? undefined });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { structureId?: string; contentType?: "website" | "blog" | "article" };
  try {
    body = (await request.json()) as { structureId?: string; contentType?: "website" | "blog" | "article" };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return previewResponse({ structureId: body.structureId, userId: user.id, contentType: body.contentType });
}
