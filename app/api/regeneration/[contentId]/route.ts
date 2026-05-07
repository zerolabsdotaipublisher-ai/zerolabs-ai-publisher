import { type NextRequest, NextResponse } from "next/server";
import {
  getOwnedRegenerationContext,
  normalizeRegenerationContentIdParam,
} from "@/lib/regeneration";
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
  const contentId = normalizeRegenerationContentIdParam(rawContentId);
  const result = await getOwnedRegenerationContext(user.id, contentId);
  if (!result) {
    return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    summary: result.summary,
    draft: result.currentDraft,
    supportedModes: ["rewrite", "improve", "expand", "shorten", "simplify", "adjust_tone"],
    supportedLevels: ["full", "section", "field"],
  });
}
