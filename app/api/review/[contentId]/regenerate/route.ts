import { NextResponse } from "next/server";
import { normalizeContentIdParam, regenerateOwnedReviewContent } from "@/lib/review";
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

  try {
    const result = await regenerateOwnedReviewContent({ userId: user.id, contentId });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, validationErrors: result.validationErrors }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, error: "Regeneration failed" }, { status: 500 });
  }
}
