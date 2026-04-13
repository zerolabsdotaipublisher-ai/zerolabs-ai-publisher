import { type NextRequest, NextResponse } from "next/server";
import { loadEditorStructure, reorderNavigation, saveEditorStructureDraft, setNavigationInclusion, updateNavigationLabel } from "@/lib/editor";
import { getServerUser } from "@/lib/supabase/server";

interface NavigationUpdateItem {
  href: string;
  label?: string;
  visible?: boolean;
}

interface UpdateNavigationBody {
  structureId?: string;
  location?: "primary" | "footer";
  items?: NavigationUpdateItem[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateNavigationBody;
  try {
    body = (await request.json()) as UpdateNavigationBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok: false, error: "structureId and items are required" }, { status: 400 });
  }

  const location = body.location || "primary";
  const structure = await loadEditorStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  let next = structure;

  body.items.forEach((item) => {
    if (typeof item.label === "string") {
      next = updateNavigationLabel(next, item.href, item.label);
    }

    if (typeof item.visible === "boolean") {
      next = setNavigationInclusion(next, location, item.href, item.visible);
    }
  });

  next = reorderNavigation(next, body.items.map((item) => item.href), location);

  const result = await saveEditorStructureDraft(user.id, next);
  if (result.error || !result.structure) {
    return NextResponse.json({ ok: false, error: result.error || "Failed to update navigation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, structure: result.structure, validationErrors: result.validationErrors });
}
