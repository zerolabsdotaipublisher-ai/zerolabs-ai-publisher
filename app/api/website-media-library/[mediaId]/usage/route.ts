import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { parseWebsiteMediaUsageBody } from "@/lib/website-media-library/schema";
import { listWebsiteMediaUsage, trackWebsiteMediaUsage } from "@/lib/website-media-library/workflow";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;

  try {
    const result = await listWebsiteMediaUsage({ userId: user.id, itemId: decodeURIComponent(mediaId).trim() });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load website media usage." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;
  const body = parseWebsiteMediaUsageBody(await request.json().catch(() => ({})));
  if (!body.usageKind) {
    return NextResponse.json({ ok: false, error: "usageKind is required." }, { status: 400 });
  }

  try {
    const result = await trackWebsiteMediaUsage({
      userId: user.id,
      itemId: decodeURIComponent(mediaId).trim(),
      usageKind: body.usageKind,
      websiteId: body.websiteId,
      contentId: body.contentId,
      contentType: body.contentType,
      pageId: body.pageId,
      sectionId: body.sectionId,
      metadata: body.metadata,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to track website media usage." },
      { status: 400 },
    );
  }
}
