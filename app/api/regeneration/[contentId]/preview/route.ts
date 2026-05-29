import { type NextRequest, NextResponse } from "next/server";
import {
  normalizeRegenerationContentIdParam,
  parseRegenerationPreviewPayload,
  runRegenerationPreviewWorkflow,
} from "@/lib/regeneration";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeRegenerationContentIdParam(rawContentId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseRegenerationPreviewPayload(body);
  if (!parsed.payload) {
    return NextResponse.json({ ok: false, error: "Invalid regeneration request", validationErrors: parsed.validationErrors }, { status: 400 });
  }

  const result = await runRegenerationPreviewWorkflow({
    userId: user.id,
    contentId,
    request: parsed.payload.request,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, validationErrors: result.validationErrors, summary: result.summary },
      { status: result.validationErrors.length > 0 ? 422 : 400 },
    );
  }

  return NextResponse.json(result);
}
