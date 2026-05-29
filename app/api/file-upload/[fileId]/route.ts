import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getOwnedFileUploadDetail } from "@/lib/file-upload/workflow";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  try {
    const detail = await getOwnedFileUploadDetail({ userId: user.id, uploadId: decodeURIComponent(fileId).trim() });
    if (!detail) {
      return NextResponse.json({ ok: false, error: "Uploaded file not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...detail });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to load uploaded file.");
  }
}
