import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { deleteWebsiteMediaLibraryItem } from "@/lib/website-media-library/workflow";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;

  try {
    const result = await deleteWebsiteMediaLibraryItem({ userId: user.id, itemId: decodeURIComponent(mediaId).trim() });
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "Website media item not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, mode: result.mode, item: result.item });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to delete website media item." },
      { status: 400 },
    );
  }
}
