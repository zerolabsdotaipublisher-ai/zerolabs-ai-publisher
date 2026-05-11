import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { createWebsiteAssetApiRecord, getWebsiteAssetDelivery, getWebsiteAssetRecordById, parseWebsiteAssetUrlRequest } from "@/lib/website-asset-retrieval";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  const { assetId } = await context.params;
  const normalizedAssetId = decodeURIComponent(assetId).trim();
  const query = parseWebsiteAssetUrlRequest(request.nextUrl.searchParams);

  try {
    const asset = await getWebsiteAssetRecordById(normalizedAssetId);
    if (!asset) {
      return NextResponse.json({ ok: false, error: "Website asset not found." }, { status: 404 });
    }

    const delivery = await getWebsiteAssetDelivery({
      assetId: normalizedAssetId,
      userId: user?.id,
      previewToken: query.previewToken,
      surface: query.surface,
      direct: query.direct,
    });

    return NextResponse.json({
      ok: true,
      asset: createWebsiteAssetApiRecord(asset, delivery),
      url: delivery.safeAccessUrl,
      expiresAt: delivery.expiresAt,
      cacheControl: delivery.cacheControl,
    });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to generate website asset URL.");
  }
}
