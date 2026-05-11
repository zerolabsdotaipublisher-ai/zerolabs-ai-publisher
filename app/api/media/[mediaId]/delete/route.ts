import { NextResponse } from "next/server";
import { deleteOwnedMedia } from "@/lib/media/workflow";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;
  const normalizedMediaId = decodeURIComponent(mediaId).trim();

  try {
    const result = await deleteOwnedMedia({ userId: user.id, mediaId: normalizedMediaId });
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to delete media" }, { status: 500 });
  }
}
