import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/observability";
import { listSocialPosts } from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

function parseLimit(value: string | null): number {
  if (!value || !/^\d+$/.test(value.trim())) {
    return 25;
  }
  const parsed = Number.parseInt(value, 10);
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
  } catch (error) {
    logger.error("social list route failed", {
      category: "error",
      service: "supabase",
      metadata: {
        userId: user.id,
        structureId,
        limit,
      },
      error: {
        name: "SocialListRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json({ ok: false, error: "Unable to list social posts" }, { status: 500 });
  }
}
