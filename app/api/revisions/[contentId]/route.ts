import { NextRequest, NextResponse } from "next/server";
import { listOwnedRevisionHistory, normalizeRevisionContentIdParam, parseRevisionListQuery } from "@/lib/revisions";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeRevisionContentIdParam(rawContentId);
  const query = parseRevisionListQuery(request.nextUrl.searchParams);

  const result = await listOwnedRevisionHistory(user.id, contentId, query);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    revisions: result.revisions,
    scenarios: result.scenarios,
    mvpBoundaries: result.mvpBoundaries,
  });
}
