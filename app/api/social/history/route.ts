import { type NextRequest, NextResponse } from "next/server";
import { listOwnedSocialPublishHistoryJobs, normalizeSocialPublishHistoryFilter } from "@/lib/social/history";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filter = normalizeSocialPublishHistoryFilter({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      platform: request.nextUrl.searchParams.get("platform") ?? undefined,
      accountId: request.nextUrl.searchParams.get("accountId") ?? undefined,
      from: request.nextUrl.searchParams.get("from") ?? undefined,
      to: request.nextUrl.searchParams.get("to") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      perPage: request.nextUrl.searchParams.get("perPage") ?? undefined,
    });

    const result = await listOwnedSocialPublishHistoryJobs(user.id, filter);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to list social history" },
      { status: 422 },
    );
  }
}
