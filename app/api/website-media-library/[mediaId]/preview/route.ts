import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { createWebsiteMediaLibraryPreview } from "@/lib/website-media-library/workflow";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;
  const expiresInSecondsParam = request.nextUrl.searchParams.get("expiresInSeconds");
  const expiresInSeconds = expiresInSecondsParam ? Number.parseInt(expiresInSecondsParam, 10) : undefined;

  try {
    const preview = await createWebsiteMediaLibraryPreview({
      userId: user.id,
      itemId: decodeURIComponent(mediaId).trim(),
      expiresInSeconds: Number.isFinite(expiresInSeconds) ? expiresInSeconds : undefined,
    });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to create preview." },
      { status: 400 },
    );
  }
}
