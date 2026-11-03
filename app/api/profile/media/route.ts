import { NextResponse } from "next/server";
import { ProfileMediaError, uploadProfileMedia } from "@/lib/profile-media-server";
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
      return NextResponse.json({ ok: false, error: { code: "VALIDATION_ERROR", message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: { code: "UPLOAD_FAILED", message: "We couldn't upload that image. Your selection is still ready to retry." } }, { status: 500 });
  }
}
