import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import {
  createPreviewShareToken,
  toAbsolutePreviewShareUrl,
} from "@/lib/preview/sharing";

interface ShareBody {
  structureId?: string;
  ttlMinutes?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ShareBody;
  try {
    body = (await request.json()) as ShareBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const structure = await getOwnedPreviewStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  const result = createPreviewShareToken(
    structure.id,
    user.id,
    body.ttlMinutes,
  );

  return NextResponse.json({
    structureId: structure.id,
    shareToken: result.shareToken,
    sharePath: result.sharePath,
    shareUrl: toAbsolutePreviewShareUrl(result.sharePath),
    expiresAt: result.expiresAt,
  });
}
