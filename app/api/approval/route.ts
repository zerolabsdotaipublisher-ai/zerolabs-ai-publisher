import { type NextRequest, NextResponse } from "next/server";
import { listOwnedApprovalPage, parseApprovalQuery } from "@/lib/approval";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseApprovalQuery(request.nextUrl.searchParams);
    const page = await listOwnedApprovalPage(user.id, query);
    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load approval queue" }, { status: 500 });
  }
}
