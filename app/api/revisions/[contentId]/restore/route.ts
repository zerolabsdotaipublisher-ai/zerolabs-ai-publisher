import { NextRequest, NextResponse } from "next/server";
import { normalizeRevisionContentIdParam, parseRevisionRestoreBody, restoreOwnedRevision } from "@/lib/revisions";
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

  const payload = parseRevisionRestoreBody(body);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "revisionId and confirm=true are required" }, { status: 400 });
  }

  try {
    const restoredRevision = await restoreOwnedRevision({
      userId: user.id,
      contentId,
      revisionId: payload.revisionId,
    });

    if (!restoredRevision) {
      return NextResponse.json({ ok: false, error: "Revision not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, restoredRevision });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to restore revision" },
      { status: 409 },
    );
  }
}
