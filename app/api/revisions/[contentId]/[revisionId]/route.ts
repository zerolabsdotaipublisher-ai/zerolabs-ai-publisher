import { NextResponse } from "next/server";
import { getOwnedRevisionDetail, normalizeRevisionContentIdParam } from "@/lib/revisions";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ contentId: string; revisionId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId, revisionId } = await context.params;
  const contentId = normalizeRevisionContentIdParam(rawContentId);

  const revision = await getOwnedRevisionDetail(user.id, contentId, revisionId);
  if (!revision) {
    return NextResponse.json({ ok: false, error: "Revision not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, revision });
}
