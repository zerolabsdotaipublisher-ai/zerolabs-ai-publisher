import { type NextRequest, NextResponse } from "next/server";
import { resolveManualOverridePermission } from "@/lib/publish/override/permissions";
import { getOwnedPublishStructure } from "@/lib/publish/storage";
import { getOwnedPublishingStatus } from "@/lib/publish/status/storage";
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

  const structure = await getOwnedPublishStructure(structureId, user.id);
  const permission = resolveManualOverridePermission(user, structure?.userId);

  return NextResponse.json({
    ok: true,
    status,
    overrideStatus: {
      canUseOverride: permission.allowed,
      canBypassApproval: permission.canBypassApproval,
      reason: permission.reason,
      lastOverride: status.manualOverride,
    },
  });
}
