import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { canManageOwnedFileUploads } from "@/lib/file-upload/permissions";
import { parseFileUploadBody } from "@/lib/file-upload/schema";
import { uploadOwnedFileBatch } from "@/lib/file-upload/workflow";

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

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (!files.length) {
    return NextResponse.json({ ok: false, error: "At least one file is required." }, { status: 400 });
  }

  try {
    const body = parseFileUploadBody(formData);
    const results = await uploadOwnedFileBatch({
      userId: user.id,
      tenantId: body.tenantId,
      source: body.source ?? "media_library",
      linkedContentId: body.linkedContentId,
      linkedContentType: body.linkedContentType,
      usageContext: body.usageContext,
      associations: body.associations,
      metadata: body.metadata,
      files: await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSizeBytes: file.size,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })),
      ),
    });

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to upload files." },
      { status: 400 },
    );
  }
}
