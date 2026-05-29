import { NextRequest, NextResponse } from "next/server";
import { compareOwnedRevisions, normalizeRevisionContentIdParam, parseRevisionCompareBody } from "@/lib/revisions";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ contentId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeRevisionContentIdParam(rawContentId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parseRevisionCompareBody(body);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "leftRevisionId and rightRevisionId are required" }, { status: 400 });
  }

  const comparison = await compareOwnedRevisions({
    userId: user.id,
    contentId,
    leftRevisionId: payload.leftRevisionId,
    rightRevisionId: payload.rightRevisionId,
  });

  if (!comparison) {
    return NextResponse.json({ ok: false, error: "Revisions not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, comparison });
}
