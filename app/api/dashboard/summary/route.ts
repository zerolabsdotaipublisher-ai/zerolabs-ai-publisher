import { NextResponse } from "next/server";
import { buildDashboardSummary, getDashboardUserDisplayName, getDefaultDashboardErrorMessage } from "@/lib/dashboard";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName: getDashboardUserDisplayName(user.user_metadata),
    });

    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json({ ok: false, error: getDefaultDashboardErrorMessage() }, { status: 500 });
  }
}
