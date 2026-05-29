import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { resolveTenantId } from "@/lib/media/model";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { parseWebsiteAssetResolveQuery, resolveWebsiteAsset, WEBSITE_ASSET_RETRIEVAL_MVP_BOUNDARIES, websiteAssetRetrievalScenarios } from "@/lib/website-asset-retrieval";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  const query = parseWebsiteAssetResolveQuery(request.nextUrl.searchParams);

  try {
    const asset = await resolveWebsiteAsset({
      ...query,
      userId: user?.id,
      tenantId: user ? resolveTenantId(user.id, query.tenantId) : query.tenantId,
    });

    if (!asset) {
      return NextResponse.json({ ok: false, error: "Website asset not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      asset,
      scenarios: websiteAssetRetrievalScenarios.map((entry) => entry.id),
      mvpBoundaries: [...WEBSITE_ASSET_RETRIEVAL_MVP_BOUNDARIES],
    });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to resolve website asset.");
  }
}
