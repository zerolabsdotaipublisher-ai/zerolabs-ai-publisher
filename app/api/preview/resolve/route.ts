import { type NextRequest, NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { resolveSharedPreviewAccess } from "@/lib/preview/security";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const access = await resolveSharedPreviewAccess(token);
  if (!access) {
    return NextResponse.json({ error: "Invalid or expired preview token" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    structureId: access.structure.id,
    previewPath: routes.previewShared(token),
    expiresAt: access.expiresAt,
  });
}
