import { NextResponse } from "next/server";
import { getOwnedSocialPublishHistoryDetail } from "@/lib/social/history";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const history = await getOwnedSocialPublishHistoryDetail(id, user.id);
  if (!history) {
    return NextResponse.json({ ok: false, error: "History job not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, history });
}
