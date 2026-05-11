import { NextRequest, NextResponse } from "next/server";
import { AI_ASSET_MVP_BOUNDARIES, aiAssetScenarios, listOwnedAiAssetLibrary, parseAiAssetListQuery } from "@/lib/ai-assets";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim() || undefined;
  const query = parseAiAssetListQuery(request.nextUrl.searchParams);

  try {
    const result = await listOwnedAiAssetLibrary({
      userId: user.id,
      tenantId,
      query,
    });

    return NextResponse.json({
      ok: true,
      items: result.items,
      total: result.page.total,
      page: result.page.page,
      perPage: result.page.perPage,
      hasMore: result.page.hasMore,
      scenarios: aiAssetScenarios.map((entry) => entry.id),
      mvpBoundaries: [...AI_ASSET_MVP_BOUNDARIES],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to list AI assets" },
      { status: 500 },
    );
  }
}
