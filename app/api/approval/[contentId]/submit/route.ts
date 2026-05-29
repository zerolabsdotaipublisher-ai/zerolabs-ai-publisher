import { type NextRequest, NextResponse } from "next/server";
import { normalizeApprovalContentIdParam, submitOwnedContentForApproval } from "@/lib/approval";
import { getServerUser } from "@/lib/supabase/server";

interface SubmitBody {
  note?: string;
  role?: "creator" | "reviewer" | "approver";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ contentId: string }> },
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contentId: rawContentId } = await context.params;
  const contentId = normalizeApprovalContentIdParam(rawContentId);

  let body: SubmitBody = {};
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    // note optional
  }

  const result = await submitOwnedContentForApproval({
    userId: user.id,
    contentId,
    note: body.note,
    role: body.role,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to submit for approval" }, { status: 400 });
  }

  return NextResponse.json(result);
}
