import { NextRequest, NextResponse } from "next/server";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { getServerUser } from "@/lib/supabase/server";
import { summarizeWebsiteVersionComparison } from "@/lib/versions/compare";
import { getWebsiteVersion } from "@/lib/versions/storage";

interface RouteContext {
  params: Promise<{ versionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId")?.trim();
  if (!structureId) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  const structure = await getWebsiteStructure(structureId, user.id);
  if (!structure || structure.management?.deletedAt) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  const { versionId } = await context.params;
  const version = await getWebsiteVersion(structureId, versionId, user.id);
  if (!version) {
    return NextResponse.json({ ok: false, error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    version,
    comparison: summarizeWebsiteVersionComparison(structure, version),
  });
}
