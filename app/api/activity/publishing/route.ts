import { type NextRequest, NextResponse } from "next/server";
import { getPublishingActivityOverview } from "@/lib/activity/model";
import { parsePublishingActivityQuery } from "@/lib/activity/schema";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parsePublishingActivityQuery(request.nextUrl.searchParams);
    const overview = await getPublishingActivityOverview(user.id, query);
    return NextResponse.json({ ok: true, overview });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load publishing activity overview" }, { status: 500 });
  }
}
