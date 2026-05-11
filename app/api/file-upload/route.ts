import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { canManageOwnedFileUploads } from "@/lib/file-upload/permissions";
import { parseFileUploadBody } from "@/lib/file-upload/schema";
import { uploadOwnedFile } from "@/lib/file-upload/workflow";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageOwnedFileUploads(user);
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
    const body = parseFileUploadBody(formData);
    const uploaded = await uploadOwnedFile({
      userId: user.id,
      source: body.source ?? "media_library",
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
      tenantId: body.tenantId,
      retryUploadId: body.retryUploadId,
      linkedContentId: body.linkedContentId,
      linkedContentType: body.linkedContentType,
      usageContext: body.usageContext,
      associations: body.associations,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true, ...uploaded, progressSupported: true });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to upload file.");
  }
}
