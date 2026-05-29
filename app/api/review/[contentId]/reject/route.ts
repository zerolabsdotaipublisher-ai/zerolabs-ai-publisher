import { NextResponse } from "next/server";
import { getOwnedReviewDetail, normalizeContentIdParam, parseDecisionState, setOwnedReviewState } from "@/lib/review";
import { getServerUser } from "@/lib/supabase/server";

interface RejectBody {
  note?: string;
  state?: string;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeContentIdParam(rawContentId);

  let body: RejectBody = {};
  try {
    body = (await request.json()) as RejectBody;
  } catch {
    // note is optional
  }

  const parsed = parseDecisionState(body.state);
  const state = parsed === "needs_changes" ? "needs_changes" : "rejected";

  const result = await setOwnedReviewState({
    userId: user.id,
    contentId,
    state,
    note: body.note,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to reject content" }, { status: 404 });
  }

  const detail = await getOwnedReviewDetail(user.id, contentId);
  return NextResponse.json({ ok: true, detail });
}
