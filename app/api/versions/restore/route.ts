import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { restoreWebsiteVersion } from "@/lib/versions/restore";

interface RestoreBody {
  structureId?: string;
  versionId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: RestoreBody;
  try {
    body = (await request.json()) as RestoreBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.versionId?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId and versionId are required" }, { status: 400 });
  }

  try {
    const result = await restoreWebsiteVersion({
      structureId: body.structureId,
      versionId: body.versionId,
      userId: user.id,
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      structure: result.structure,
      restoredVersion: result.restoredVersion
        ? {
            id: result.restoredVersion.id,
            versionNumber: result.restoredVersion.versionNumber,
          }
        : undefined,
      versions: result.versions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to restore version",
      },
      { status: 409 },
    );
  }
}
