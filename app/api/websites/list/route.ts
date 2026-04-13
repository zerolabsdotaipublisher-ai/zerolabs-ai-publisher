import { type NextRequest, NextResponse } from "next/server";
import { listManagedWebsites, type WebsiteStatusFilter } from "@/lib/management";
import { getServerUser } from "@/lib/supabase/server";

const VALID_STATUS_FILTERS: WebsiteStatusFilter[] = [
  "all",
  "draft",
  "published",
  "update_pending",
  "publishing",
  "update_failed",
  "unpublished",
  "archived",
  "deleted",
];

function parseStatusFilter(value: string | null): WebsiteStatusFilter {
  if (!value) {
    return "all";
  }

  if (VALID_STATUS_FILTERS.includes(value as WebsiteStatusFilter)) {
    return value as WebsiteStatusFilter;
  }

  return "all";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("query") ?? undefined;
  const status = parseStatusFilter(request.nextUrl.searchParams.get("status"));
  const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "true";

  try {
    const websites = await listManagedWebsites(user.id, {
      query,
      status,
      includeDeleted,
    });

    return NextResponse.json({
      ok: true,
      websites,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to list websites" }, { status: 500 });
  }
}
