import { NextRequest, NextResponse } from "next/server";
import { createAnonymousStorageActor, createScopedUserStorageActor } from "@/lib/storage-access";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { getServerUser } from "@/lib/supabase/server";
import { createWebsiteMediaLibraryPreview } from "@/lib/website-media-library/workflow";

interface RouteContext {
  params: Promise<{ mediaId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  const { mediaId } = await context.params;
  const expiresInSecondsParam = request.nextUrl.searchParams.get("expiresInSeconds");
  const expiresInSeconds = expiresInSecondsParam ? Number.parseInt(expiresInSecondsParam, 10) : undefined;
  const normalizedExpiresInSeconds =
    expiresInSeconds !== undefined && Number.isFinite(expiresInSeconds) ? expiresInSeconds : undefined;

  try {
    const preview = await createWebsiteMediaLibraryPreview({
      userId: user?.id,
      actor: user ? createScopedUserStorageActor(user.id, user.id) : createAnonymousStorageActor(),
      itemId: decodeURIComponent(mediaId).trim(),
      expiresInSeconds: normalizedExpiresInSeconds,
    });
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to create preview.");
  }
}
