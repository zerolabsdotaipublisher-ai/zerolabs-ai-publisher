import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { parseFileUploadSignedUrlQuery } from "@/lib/file-upload/schema";
import { createOwnedFileUploadSignedUrl } from "@/lib/file-upload/workflow";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  try {
    const signed = await createOwnedFileUploadSignedUrl({
      userId: user.id,
      uploadId: decodeURIComponent(fileId).trim(),
      ...parseFileUploadSignedUrlQuery(new URL(request.url).searchParams),
    });

    return NextResponse.json({ ok: true, signed });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to create signed URL.");
  }
}
