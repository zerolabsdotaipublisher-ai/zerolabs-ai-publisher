import { NextRequest, NextResponse } from "next/server";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { getServerUser } from "@/lib/supabase/server";
import { summarizeWebsiteVersionComparison } from "@/lib/versions/compare";
import { listWebsiteVersions } from "@/lib/versions/storage";

export async function GET(request: NextRequest): Promise<NextResponse> {
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

  const versions = await listWebsiteVersions(structureId, user.id);
  return NextResponse.json({
    ok: true,
    versions: versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      label: version.label,
      status: version.status,
      source: version.source,
      structureVersion: version.structureVersion,
      isLive: version.isLive,
      isCurrentDraft: version.isCurrentDraft,
      restoredFromVersionId: version.restoredFromVersionId,
      createdAt: version.createdAt,
      deployment: version.deployment,
      comparison: summarizeWebsiteVersionComparison(structure, version),
    })),
  });
}
