import { NextResponse } from "next/server";
import { getOwnedReviewDetail, normalizeContentIdParam, setOwnedReviewState } from "@/lib/review";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeContentIdParam(rawContentId);

  const result = await setOwnedReviewState({
    userId: user.id,
    contentId,
    state: "approved",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to approve content" }, { status: 404 });
  }

  const detail = await getOwnedReviewDetail(user.id, contentId);
  return NextResponse.json({ ok: true, detail });
}
