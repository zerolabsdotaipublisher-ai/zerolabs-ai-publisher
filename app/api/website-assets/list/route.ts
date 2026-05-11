import { NextRequest, NextResponse } from "next/server";
import { resolveTenantId } from "@/lib/media/model";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { getServerUser } from "@/lib/supabase/server";
import { parseWebsiteAssetResolveQuery, listWebsiteAssets, WEBSITE_ASSET_RETRIEVAL_MVP_BOUNDARIES, websiteAssetRetrievalScenarios } from "@/lib/website-asset-retrieval";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseWebsiteAssetResolveQuery(request.nextUrl.searchParams);
    const result = await listWebsiteAssets({
      ...query,
      userId: user.id,
      tenantId: resolveTenantId(user.id, query.tenantId),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      scenarios: websiteAssetRetrievalScenarios.map((entry) => entry.id),
      mvpBoundaries: [...WEBSITE_ASSET_RETRIEVAL_MVP_BOUNDARIES],
    });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to list website assets.");
  }
}
