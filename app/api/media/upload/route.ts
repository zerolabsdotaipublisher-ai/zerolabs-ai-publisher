import { NextResponse } from "next/server";
import { buildFileUploadAssociations } from "@/lib/file-upload/associations";
import { uploadOwnedFile } from "@/lib/file-upload/workflow";
import { parseUsageContext } from "@/lib/media/schema";
import { canManageOwnedMedia } from "@/lib/media/permissions";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageOwnedMedia(user);
  if (!permission.allowed) {
    return NextResponse.json({ ok: false, error: permission.reason || "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }

  const linkedContentId = typeof formData.get("linkedContentId") === "string"
    ? String(formData.get("linkedContentId")).trim() || undefined
    : undefined;
  const linkedContentType = typeof formData.get("linkedContentType") === "string"
    ? String(formData.get("linkedContentType")).trim() || undefined
    : undefined;
  const tenantId = typeof formData.get("tenantId") === "string" ? String(formData.get("tenantId")).trim() || undefined : undefined;
  const usageContext = typeof formData.get("usageContext") === "string"
    ? parseUsageContext(String(formData.get("usageContext")))
    : undefined;

  try {
    const uploaded = await uploadOwnedFile({
      userId: user.id,
      source: "media_library",
      tenantId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
      linkedContentId,
      linkedContentType,
      usageContext,
      associations: buildFileUploadAssociations({
        source: "media_library",
        linkedContentId,
        linkedContentType,
        metadata: { surface: "media-upload-route" },
      }),
      metadata: { surface: "media-upload-route" },
    });

    return NextResponse.json({
      ok: true,
      upload: uploaded.upload,
      media: uploaded.media,
      signed: uploaded.signed,
      progressSupported: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to upload media",
      },
      { status: 400 },
    );
  }
}
