import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { canManageWebsiteMediaLibrary } from "@/lib/website-media-library/permissions";
import { parseWebsiteMediaUploadBody } from "@/lib/website-media-library/schema";
import { uploadWebsiteMediaLibraryItem } from "@/lib/website-media-library/workflow";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageWebsiteMediaLibrary(user);
  if (!permission.allowed) {
    return NextResponse.json({ ok: false, error: permission.reason || "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }

  try {
    const body = parseWebsiteMediaUploadBody(formData);
    const uploaded = await uploadWebsiteMediaLibraryItem({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
      ...body,
    });

    return NextResponse.json({
      ok: true,
      item: uploaded.item,
      preview: uploaded.preview,
      media: uploaded.media,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to upload website media." },
      { status: 400 },
    );
  }
}
