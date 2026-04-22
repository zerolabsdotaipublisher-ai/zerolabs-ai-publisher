import { type NextRequest, NextResponse } from "next/server";
import { getWebsiteGeneratedContent } from "@/lib/ai/content";
import { getWebsiteSeoMetadata } from "@/lib/ai/seo";
import { buildSeoPreviewPayload } from "@/lib/seo";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import { getServerUser } from "@/lib/supabase/server";

async function previewResponse(args: {
  structureId: string;
  userId: string;
}): Promise<NextResponse> {
  const structure = await getOwnedPreviewStructure(args.structureId, args.userId);
  if (!structure) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  const [content, storedSeo] = await Promise.all([
    getWebsiteGeneratedContent(args.structureId, args.userId).catch(() => null),
    getWebsiteSeoMetadata(args.structureId, args.userId).catch(() => null),
  ]);

  return NextResponse.json({
    structure,
    content,
    preview: buildSeoPreviewPayload({
      structure,
      contentType: "website",
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
  if (!structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return previewResponse({ structureId, userId: user.id });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { structureId?: string };
  try {
    body = (await request.json()) as { structureId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  return previewResponse({ structureId: body.structureId, userId: user.id });
}
