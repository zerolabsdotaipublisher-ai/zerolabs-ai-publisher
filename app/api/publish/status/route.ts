import { type NextRequest, NextResponse } from "next/server";
import { detectPublicationState } from "@/lib/publish";
import { validatePublishEligibility } from "@/lib/publish/validation";
import { getOwnedPublishStructure } from "@/lib/publish/storage";
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

  const structure = await getOwnedPublishStructure(structureId, user.id);
  if (!structure) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    detection: detectPublicationState(structure),
    validation: validatePublishEligibility(structure),
  });
}
