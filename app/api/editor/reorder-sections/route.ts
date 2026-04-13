import { type NextRequest, NextResponse } from "next/server";
import { reorderPageSections, updateStructurePage } from "@/lib/editor";
import { loadEditorStructure, saveEditorStructureDraft } from "@/lib/editor/storage";
import { getServerUser } from "@/lib/supabase/server";

interface ReorderBody {
  structureId?: string;
  pageId?: string;
  sectionOrder?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: ReorderBody;
  try {
    body = (await request.json()) as ReorderBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.pageId?.trim() || !Array.isArray(body.sectionOrder)) {
    return NextResponse.json({ ok: false, error: "structureId, pageId, and sectionOrder are required" }, { status: 400 });
  }

  const structure = await loadEditorStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  const reordered = updateStructurePage(structure, body.pageId, (page) => reorderPageSections(page, body.sectionOrder || []));
  const result = await saveEditorStructureDraft(user.id, reordered);

  if (result.error || !result.structure) {
    return NextResponse.json({ ok: false, error: result.error || "Failed to reorder sections" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, structure: result.structure, validationErrors: result.validationErrors });
}
