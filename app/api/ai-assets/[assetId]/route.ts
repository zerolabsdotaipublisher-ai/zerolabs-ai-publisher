import { NextRequest, NextResponse } from "next/server";
import { createOwnedAiAssetSignedUrl, getOwnedAiAssetDetail, parseAiAssetSignedUrlQuery } from "@/lib/ai-assets";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
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

  try {
    const asset = await getOwnedAiAssetDetail({ userId: user.id, assetId: normalizedAssetId });
    if (!asset) {
      return NextResponse.json({ ok: false, error: "AI asset not found" }, { status: 404 });
    }

    const signedQuery = parseAiAssetSignedUrlQuery(request.nextUrl.searchParams);
    const signed = await createOwnedAiAssetSignedUrl({
      userId: user.id,
      assetId: normalizedAssetId,
      expiresInSeconds: signedQuery.expiresInSeconds,
    });

    return NextResponse.json({ ok: true, asset, signed });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to retrieve AI asset.");
  }
}
