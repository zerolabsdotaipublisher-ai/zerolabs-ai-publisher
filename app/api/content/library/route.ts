import { type NextRequest, NextResponse } from "next/server";
import { listOwnedContentLibraryPage, parseContentLibraryQuery } from "@/lib/content/library";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = parseContentLibraryQuery(request.nextUrl.searchParams);
    const page = await listOwnedContentLibraryPage(user.id, query);

    return NextResponse.json({ ok: true, ...page });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to load content library" }, { status: 500 });
  }
}
