import { NextResponse, type NextRequest } from "next/server";
import {
  archiveOwnedGeneratedContent,
  getOwnedGeneratedContentBundle,
} from "@/lib/content";
import { getServerUser } from "@/lib/supabase/server";

function getStructureId(request: NextRequest): string {
  return request.nextUrl.searchParams.get("structureId")?.trim() ?? "";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = getStructureId(request);
  if (!structureId) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  try {
    const bundle = await getOwnedGeneratedContentBundle(structureId, user.id);
    if (!bundle) {
      return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, content: bundle });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to retrieve content" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = getStructureId(request);
  if (!structureId) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  try {
    const owned = await getOwnedGeneratedContentBundle(structureId, user.id);
    if (!owned) {
      return NextResponse.json({ ok: false, error: "Content not found" }, { status: 404 });
    }

    await archiveOwnedGeneratedContent(structureId, user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to archive content" }, { status: 500 });
  }
}
