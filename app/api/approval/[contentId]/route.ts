import { type NextRequest, NextResponse } from "next/server";
import { getOwnedApprovalDetail, normalizeApprovalContentIdParam } from "@/lib/approval";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeApprovalContentIdParam(rawContentId);
  const detail = await getOwnedApprovalDetail(user.id, contentId);

  if (!detail) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, detail });
}
