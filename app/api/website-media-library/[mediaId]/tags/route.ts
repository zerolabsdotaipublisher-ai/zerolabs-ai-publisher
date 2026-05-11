import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { parseWebsiteMediaTagBody } from "@/lib/website-media-library/schema";
import { updateWebsiteMediaLibraryTags } from "@/lib/website-media-library/workflow";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await context.params;
  const body = parseWebsiteMediaTagBody(await request.json().catch(() => ({})));

  try {
    const item = await updateWebsiteMediaLibraryTags({
      userId: user.id,
      itemId: decodeURIComponent(mediaId).trim(),
      ...body,
    });
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to update website media metadata.");
  }
}
