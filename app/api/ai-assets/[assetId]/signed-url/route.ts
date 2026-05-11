import { NextRequest, NextResponse } from "next/server";
import { createOwnedAiAssetSignedUrl, parseAiAssetSignedUrlQuery } from "@/lib/ai-assets";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await context.params;
  const normalizedAssetId = decodeURIComponent(assetId).trim();
  const query = parseAiAssetSignedUrlQuery(request.nextUrl.searchParams);

  try {
    const signed = await createOwnedAiAssetSignedUrl({
      userId: user.id,
      assetId: normalizedAssetId,
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
