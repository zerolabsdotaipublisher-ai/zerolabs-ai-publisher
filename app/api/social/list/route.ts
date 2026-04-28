import { type NextRequest, NextResponse } from "next/server";
import { listSocialPosts } from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 25;
  }
  return Math.max(1, Math.min(100, parsed));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId") ?? undefined;
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const socialPosts = await listSocialPosts(user.id, {
      structureId,
      limit,
    });

    return NextResponse.json({ ok: true, socialPosts });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to list social posts" }, { status: 500 });
  }
}
