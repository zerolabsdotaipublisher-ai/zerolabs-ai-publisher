import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { deleteOwnedFileUpload } from "@/lib/file-upload/workflow";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await context.params;
  try {
    const result = await deleteOwnedFileUpload({ userId: user.id, uploadId: decodeURIComponent(fileId).trim() });
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "Uploaded file not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true, upload: result.upload });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to delete uploaded file." },
      { status: 400 },
    );
  }
}
