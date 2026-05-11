import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { canManageWebsiteMediaLibrary } from "@/lib/website-media-library/permissions";
import { parseWebsiteMediaLibraryListQuery } from "@/lib/website-media-library/schema";
import { listWebsiteMediaLibrary } from "@/lib/website-media-library/workflow";
import { WEBSITE_MEDIA_LIBRARY_MVP_BOUNDARIES, websiteMediaLibraryScenarios } from "@/lib/website-media-library/scenarios";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageWebsiteMediaLibrary(user);
  if (!permission.allowed) {
    return NextResponse.json({ ok: false, error: permission.reason || "Forbidden" }, { status: 403 });
  }

  try {
    const result = await listWebsiteMediaLibrary({
      userId: user.id,
      tenantId: request.nextUrl.searchParams.get("tenantId")?.trim() || undefined,
      query: parseWebsiteMediaLibraryListQuery(request.nextUrl.searchParams),
    });

    return NextResponse.json({
      ok: true,
      items: result.items,
      total: result.page.total,
      page: result.page.page,
      perPage: result.page.perPage,
      hasMore: result.page.hasMore,
      scenarios: websiteMediaLibraryScenarios.map((entry) => entry.id),
      mvpBoundaries: [...WEBSITE_MEDIA_LIBRARY_MVP_BOUNDARIES],
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to load website media library." },
      { status: 400 },
    );
  }
}
