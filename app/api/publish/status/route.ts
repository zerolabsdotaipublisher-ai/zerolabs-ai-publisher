import { type NextRequest, NextResponse } from "next/server";
import { getOwnedPublishingStatus } from "@/lib/publish/status";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId");
  if (!structureId) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  const status = await getOwnedPublishingStatus(structureId, user.id);
  if (!status) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status,
  });
}
