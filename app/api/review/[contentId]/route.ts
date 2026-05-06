import { type NextRequest, NextResponse } from "next/server";
import {
  applyOwnedInlineEdit,
  getOwnedReviewDetail,
  normalizeContentIdParam,
  parseDecisionState,
  setOwnedReviewState,
} from "@/lib/review";
import { getServerUser } from "@/lib/supabase/server";

interface ReviewPatchBody {
  reviewNote?: string;
  socialTitle?: string;
  state?: string;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeContentIdParam(rawContentId);
  const detail = await getOwnedReviewDetail(user.id, contentId);

  if (!detail) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, detail });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeContentIdParam(rawContentId);

  let body: ReviewPatchBody;
  try {
    body = (await request.json()) as ReviewPatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const editResult = await applyOwnedInlineEdit(user.id, contentId, {
    socialTitle: body.socialTitle,
    reviewNote: body.reviewNote,
  });

  if (!editResult.ok) {
    return NextResponse.json(
      { ok: false, error: editResult.error, validationErrors: editResult.validationErrors },
      { status: editResult.validationErrors?.length ? 422 : 400 },
    );
  }

  const existingDetail = await getOwnedReviewDetail(user.id, contentId);
  if (!existingDetail) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  if (body.reviewNote !== undefined || body.state !== undefined) {
    const parsed = parseDecisionState(body.state);
    const state = parsed || (existingDetail.reviewState === "published" ? "approved" : existingDetail.reviewState);

    const stateResult = await setOwnedReviewState({
      userId: user.id,
      contentId,
      state,
      note: body.reviewNote,
    });

    if (!stateResult.ok) {
      return NextResponse.json({ ok: false, error: stateResult.error || "Unable to update review detail" }, { status: 400 });
    }
  }

  const detail = await getOwnedReviewDetail(user.id, contentId);
  return NextResponse.json({ ok: true, detail });
}
