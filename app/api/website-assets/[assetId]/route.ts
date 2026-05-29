import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { WEBSITE_ASSET_FALLBACK_URL } from "@/lib/website-asset-retrieval/fallbacks";
import { getWebsiteAssetDelivery, parseWebsiteAssetUrlRequest } from "@/lib/website-asset-retrieval";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  const { assetId } = await context.params;
  const query = parseWebsiteAssetUrlRequest(request.nextUrl.searchParams);

  try {
    const delivery = await getWebsiteAssetDelivery({
      assetId: decodeURIComponent(assetId).trim(),
      userId: user?.id,
      previewToken: query.previewToken,
      surface: query.surface,
      direct: true,
    });

    const response = NextResponse.redirect(delivery.safeAccessUrl, { status: 307 });
    response.headers.set("Cache-Control", delivery.cacheControl);
    response.headers.set("x-zlap-website-asset-id", decodeURIComponent(assetId).trim());
    if (delivery.isFallback) {
      response.headers.set("x-zlap-website-asset-fallback", "1");
    }
    return response;
  } catch {
    const response = NextResponse.redirect(new URL(WEBSITE_ASSET_FALLBACK_URL, request.nextUrl.origin), { status: 307 });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("x-zlap-website-asset-fallback", "1");
    return response;
  }
}
