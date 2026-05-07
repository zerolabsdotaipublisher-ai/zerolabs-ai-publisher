import { type NextRequest, NextResponse } from "next/server";
import { addOwnedApprovalComment, normalizeApprovalContentIdParam } from "@/lib/approval";
import { getServerUser } from "@/lib/supabase/server";

interface CommentBody {
  body?: string;
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

  let body: CommentBody;
  try {
    body = (await request.json()) as CommentBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ ok: false, error: "Comment body is required" }, { status: 400 });
  }

  const result = await addOwnedApprovalComment({
    userId: user.id,
    contentId,
    body: body.body,
    role: body.role,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Unable to add comment" }, { status: 400 });
  }

  return NextResponse.json(result);
}
