import { NextRequest, NextResponse } from "next/server";
import { getOwnedMediaDetail, createOwnedMediaSignedUrl } from "@/lib/media/workflow";
import { parseMediaSignedUrlQuery } from "@/lib/media/schema";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;
  const normalizedMediaId = decodeURIComponent(mediaId).trim();

  try {
    const detail = await getOwnedMediaDetail({ userId: user.id, mediaId: normalizedMediaId });
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Media not found" }, { status: 404 });
    }

    const signedQuery = parseMediaSignedUrlQuery(request.nextUrl.searchParams);
    const signed = await createOwnedMediaSignedUrl({
      userId: user.id,
      mediaId: normalizedMediaId,
      expiresInSeconds: signedQuery.expiresInSeconds,
    });

    return NextResponse.json({
      ok: true,
      media: detail,
      signed,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to retrieve media" }, { status: 500 });
  }
}
