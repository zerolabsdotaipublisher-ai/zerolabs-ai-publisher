import { NextResponse } from "next/server";
import { ProfileMediaError, deleteOwnedProfileMediaReference, uploadProfileMedia } from "@/lib/profile-media-server";
import { type ProfileMediaKind } from "@/lib/profile-media";
import { logger } from "@/lib/observability";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to upload profile media." } }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Choose a valid image file." } }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = formData.get("kind");
  if (!(file instanceof File) || typeof kind !== "string") {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Choose an image and its profile-media type." } }, { status: 400 });
  }

  try {
    const uploaded = await uploadProfileMedia({
      userId: user.id,
      kind,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return NextResponse.json({ ok: true, media: uploaded });
  } catch (error) {
    if (error instanceof ProfileMediaError) {
      logger.error("POST /api/profile/media failed", {
        category: "error",
        service: "profile-media",
        userId: user.id,
        profileMediaErrorCode: error.code,
        error: { name: "ProfileMediaError", message: error.code },
      });
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: error.status });
    }

    logger.error("POST /api/profile/media failed", {
      category: "error",
      service: "profile-media",
      userId: user.id,
      profileMediaErrorCode: "PROFILE_MEDIA_UPLOAD_FAILED",
      error: { name: "ProfileMediaError", message: "PROFILE_MEDIA_UPLOAD_FAILED" },
    });
    return NextResponse.json({ ok: false, error: { code: "PROFILE_MEDIA_UPLOAD_FAILED", message: "We couldn't upload that image. Your selection is still ready to retry." } }, { status: 500 });
  }
}

/** Deletes only an unpersisted, authenticated user's staged Supabase object. */
export async function DELETE(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Sign in to manage profile media." } }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Choose valid profile media to remove." } }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Choose valid profile media to remove." } }, { status: 400 });
  }

  const { reference, kind } = body as { reference?: unknown; kind?: unknown };
  if (typeof reference !== "string" || (kind !== "avatar" && kind !== "cover")) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_REQUEST", message: "Choose valid profile media to remove." } }, { status: 400 });
  }

  try {
    await deleteOwnedProfileMediaReference({ userId: user.id, reference, kind: kind as ProfileMediaKind });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const safeError = error instanceof ProfileMediaError
      ? error
      : new ProfileMediaError("We couldn't remove that staged image.", "STORAGE_DELETE_FAILED", 500);
    logger.error("DELETE /api/profile/media failed", {
      category: "error",
      service: "profile-media",
      userId: user.id,
      profileMediaErrorCode: safeError.code,
      error: { name: "ProfileMediaError", message: safeError.code },
    });
    return NextResponse.json({ ok: false, error: { code: safeError.code, message: safeError.message } }, { status: safeError.status });
  }
}
