import { type NextRequest, NextResponse } from "next/server";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { getServerUser } from "@/lib/supabase/server";

interface SaveEditorBody {
  structureId?: string;
  draft?: WebsiteStructure;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveEditorBody;
  try {
    body = (await request.json()) as SaveEditorBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.draft) {
    return NextResponse.json({ ok: false, error: "structureId and draft are required" }, { status: 400 });
  }

  if (body.structureId !== body.draft.id) {
    return NextResponse.json({ ok: false, error: "structureId does not match draft.id" }, { status: 400 });
  }

  const result = await saveEditorStructureDraft(user.id, body.draft);

  if (result.error && result.validationErrors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        validationErrors: result.validationErrors,
      },
      { status: 422 },
    );
  }

  if (result.error || !result.structure) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error || "Unable to save draft",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    structure: result.structure,
    validationErrors: [],
  });
}
