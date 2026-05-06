import { type NextRequest, NextResponse } from "next/server";
import { listOwnedReviewPage, parseDecisionState, parseReviewQuery, setOwnedReviewState } from "@/lib/review";
import { getServerUser } from "@/lib/supabase/server";

interface ReviewPostBody {
  contentId?: string;
  state?: string;
  note?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseReviewQuery(request.nextUrl.searchParams);
    const page = await listOwnedReviewPage(user.id, query);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load review queue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: ReviewPostBody;
  try {
    body = (await request.json()) as ReviewPostBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.contentId?.trim()) {
    return NextResponse.json({ ok: false, error: "contentId is required" }, { status: 400 });
  }

  const state = parseDecisionState(body.state);
  if (!state) {
    return NextResponse.json({ ok: false, error: "state must be pending_review, approved, rejected, or needs_changes" }, { status: 400 });
  }

  const result = await setOwnedReviewState({
    userId: user.id,
    contentId: body.contentId.trim(),
    state,
    note: body.note,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to update review state" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
