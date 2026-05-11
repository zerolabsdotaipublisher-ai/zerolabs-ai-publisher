import { NextRequest, NextResponse } from "next/server";
import { parseMediaSignedUrlQuery } from "@/lib/media/schema";
import { createOwnedMediaSignedUrl } from "@/lib/media/workflow";
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
  const query = parseMediaSignedUrlQuery(request.nextUrl.searchParams);

  try {
    const signed = await createOwnedMediaSignedUrl({
      userId: user.id,
      mediaId: normalizedMediaId,
      expiresInSeconds: query.expiresInSeconds,
    });

    return NextResponse.json({ ok: true, signed });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to generate signed URL" },
      { status: 404 },
    );
  }
}
