import { NextRequest, NextResponse } from "next/server";
import { parseMediaListQuery } from "@/lib/media/schema";
import { listOwnedMedia } from "@/lib/media/workflow";
import { MEDIA_MVP_BOUNDARIES, mediaScenarios } from "@/lib/media/scenarios";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim() || undefined;
  const query = parseMediaListQuery(request.nextUrl.searchParams);

  try {
    const result = await listOwnedMedia({
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
      scenarios: mediaScenarios.map((entry) => entry.id),
      mvpBoundaries: [...MEDIA_MVP_BOUNDARIES],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to list media" }, { status: 500 });
  }
}
