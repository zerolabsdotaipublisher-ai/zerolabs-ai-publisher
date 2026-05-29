import { type NextRequest, NextResponse } from "next/server";
import { getOwnedEditingWorkflowState, normalizeEditingContentIdParam, parseEditableSavePayload, runOwnedEditingSaveWorkflow } from "@/lib/editing";
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
  const contentId = normalizeEditingContentIdParam(rawContentId);
  const detail = await getOwnedEditingWorkflowState(user.id, contentId);

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
  const contentId = normalizeEditingContentIdParam(rawContentId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parseEditableSavePayload(body);
  if (!payload || payload.draft.contentId !== contentId) {
    return NextResponse.json({ ok: false, error: "draft payload is invalid" }, { status: 400 });
  }

  const result = await runOwnedEditingSaveWorkflow(user.id, payload.draft);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, validationIssues: result.validationIssues },
      { status: result.validationIssues?.length ? 422 : 400 },
    );
  }

  return NextResponse.json({ ok: true, detail: result.detail });
}
