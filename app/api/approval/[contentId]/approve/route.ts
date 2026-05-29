import { type NextRequest, NextResponse } from "next/server";
import { approveOwnedContent, normalizeApprovalContentIdParam } from "@/lib/approval";
import { getServerUser } from "@/lib/supabase/server";

interface ApproveBody {
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

  let body: ApproveBody = {};
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    // note optional
  }

  const result = await approveOwnedContent({
    userId: user.id,
    contentId,
    note: body.note,
    role: body.role,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to approve content" }, { status: 400 });
  }

  return NextResponse.json(result);
}
