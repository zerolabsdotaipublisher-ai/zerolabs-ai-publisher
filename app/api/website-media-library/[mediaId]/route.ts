import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteMediaLibraryItemDetail } from "@/lib/website-media-library/workflow";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;

  try {
    const item = await getWebsiteMediaLibraryItemDetail({ userId: user.id, itemId: decodeURIComponent(mediaId).trim() });
    if (!item) {
      return NextResponse.json({ ok: false, error: "Website media item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to load website media item.");
  }
}
